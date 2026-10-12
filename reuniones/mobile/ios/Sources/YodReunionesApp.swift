import SwiftUI
import AVFoundation
import CryptoKit
import Security

struct Meeting: Codable, Identifiable {
    let id: String
    let project: String
    let mime: String
    let format: String
}
enum MeetingError: Error { case invalidProject, space, audio, authentication, server, integrity }

final class Vault {
    static let root: URL = {
        let path = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("Meetings")
        try? FileManager.default.createDirectory(at: path, withIntermediateDirectories: true)
        return path
    }()
    static func save(_ data: Data, to url: URL) throws {
        try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        let file = try FileHandle(forWritingTo: url); try file.synchronize(); try file.close()
    }
    static func list() -> [URL] {
        (try? FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: [.isDirectoryKey]))?.filter { $0.hasDirectoryPath } ?? []
    }
    static func chunks(_ dir: URL) -> [URL] {
        ((try? FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)) ?? []).filter { $0.pathExtension == "wav" }.sorted { $0.lastPathComponent < $1.lastPathComponent }
    }
    static func feedback(_ dir: URL) -> String {
        guard let data=try? Data(contentsOf:dir.appendingPathComponent("result.json")),let status=(try? JSONSerialization.jsonObject(with:data)) as? [String:Any],let jobs=status["jobs"] as? [[String:Any]] else { return "Procesamiento pendiente." }
        let completed=jobs.filter { $0["state"] as? String=="done" && $0["kind"] as? String != "drive" }
        let job=completed.first { $0["kind"] as? String=="final" } ?? completed.last
        guard let result=job?["result"] as? [String:Any],let candidates=result["candidates"] as? [[String:Any]] else { return "Procesamiento pendiente." }
        return candidates.map { "Por confirmar (\(Int($0["start"] as? Double ?? 0)) s): \($0["quote"] as? String ?? "")\n\($0["question"] as? String ?? "")" }.joined(separator:"\n\n")
    }
    static func export(_ dir: URL) throws -> URL {
        let files=chunks(dir)
        guard !files.isEmpty else { throw MeetingError.audio }
        var total=0
        for (index,file) in files.enumerated() {
            guard Int(file.deletingPathExtension().lastPathComponent)==index else { throw MeetingError.integrity }
            total += (try file.resourceValues(forKeys:[.fileSizeKey]).fileSize ?? 0)-44
        }
        guard total>0,total<4_000_000_000 else { throw MeetingError.audio }
        var header=try Data(contentsOf:files[0]).prefix(44)
        var riff=UInt32(total+36).littleEndian;var length=UInt32(total).littleEndian
        withUnsafeBytes(of:&riff) { header.replaceSubrange(4..<8,with:$0) }
        withUnsafeBytes(of:&length) { header.replaceSubrange(40..<44,with:$0) }
        let destination=FileManager.default.temporaryDirectory.appendingPathComponent("YOD-\(dir.lastPathComponent).wav")
        try save(Data(header),to:destination)
        let handle=try FileHandle(forWritingTo:destination)
        do {
            try handle.seekToEnd()
            for file in files { try handle.write(contentsOf:Data(contentsOf:file).dropFirst(44)) }
            try handle.synchronize();try handle.close()
        } catch { try? handle.close();throw error }
        return destination
    }
    static func wav(_ raw: URL) throws {
        let pcm = try Data(contentsOf: raw)
        guard pcm.count > 0, pcm.count % 2 == 0 else { return }
        var data = Data()
        func string(_ s: String) { data.append(s.data(using: .ascii)!) }
        func u32(_ n: UInt32) { var v=n.littleEndian; withUnsafeBytes(of: &v) { data.append(contentsOf: $0) } }
        func u16(_ n: UInt16) { var v=n.littleEndian; withUnsafeBytes(of: &v) { data.append(contentsOf: $0) } }
        string("RIFF");u32(UInt32(pcm.count+36));string("WAVEfmt ");u32(16);u16(1);u16(1);u32(16000);u32(32000);u16(2);u16(16);string("data");u32(UInt32(pcm.count));data.append(pcm)
        try save(data,to: raw.deletingPathExtension().appendingPathExtension("wav"))
    }
    static func recover() throws {
        for dir in list() {
            for raw in try FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil) where raw.pathExtension == "pcm" {
                let wave=raw.deletingPathExtension().appendingPathExtension("wav")
                if !FileManager.default.fileExists(atPath: wave.path) { try wav(raw) }
            }
            let end=dir.appendingPathComponent("end.json")
            if !FileManager.default.fileExists(atPath: end.path) { try save(Data("{\"interrupted\":true}".utf8),to:end) }
        }
    }
    static func connection(_ value: Data? = nil) throws -> Data? {
        let query: [String: Any] = [kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:"mx.yod.reuniones",kSecAttrAccount as String:"device"]
        if let value {
            let attributes: [String:Any] = [kSecValueData as String:value,kSecAttrAccessible as String:kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]
            let status=SecItemUpdate(query as CFDictionary,attributes as CFDictionary)
            if status == errSecItemNotFound {
                var add=query;attributes.forEach { add[$0.key]=$0.value }
                guard SecItemAdd(add as CFDictionary,nil)==errSecSuccess else { throw MeetingError.authentication }
            } else if status != errSecSuccess { throw MeetingError.authentication }
            return value
        }
        var read=query;read[kSecReturnData as String]=true;read[kSecMatchLimit as String]=kSecMatchLimitOne
        var item: CFTypeRef?;let status=SecItemCopyMatching(read as CFDictionary,&item)
        if status==errSecItemNotFound { return nil }
        guard status==errSecSuccess else { throw MeetingError.authentication }
        return item as? Data
    }
}

actor Uploader {
    private var busy=false
    func sync() async throws -> Bool {
        if busy { return false };busy=true;defer { busy=false }
        var verified=false
        var unfinished=false
        guard let credentials=try Vault.connection(),let config=try JSONSerialization.jsonObject(with: credentials) as? [String:String],let server=config["server"],let token=config["token"] else { throw MeetingError.authentication }
        guard let base=URL(string:server),base.scheme=="https",base.user==nil,base.password==nil,base.query==nil,base.fragment==nil else { throw MeetingError.server }
        func request(_ path: String, method: String="GET", body: Data?=nil, headers: [String:String]=[:]) async throws -> [String:Any] {
            var r=URLRequest(url:URL(string:server.trimmingCharacters(in:CharacterSet(charactersIn:"/"))+path)!)
            r.httpMethod=method;r.httpBody=body;r.timeoutInterval=45;r.setValue("Bearer "+token,forHTTPHeaderField:"Authorization")
            headers.forEach { r.setValue($0.value,forHTTPHeaderField:$0.key) }
            let (data,response)=try await URLSession.shared.data(for:r)
            guard let http=response as? HTTPURLResponse,(200...299).contains(http.statusCode) else { throw MeetingError.server }
            guard let value=try JSONSerialization.jsonObject(with:data) as? [String:Any] else { throw MeetingError.integrity }
            return value
        }
        for dir in Vault.list() {
            let closedAtStart=FileManager.default.fileExists(atPath:dir.appendingPathComponent("end.json").path)
            let meeting=try Data(contentsOf:dir.appendingPathComponent("meeting.json"));let path="/meetings/"+dir.lastPathComponent
            _=try await request(path,method:"POST",body:meeting,headers:["Content-Type":"application/json"])
            var manifest: [[String:Any]]=[]
            for (seq,file) in Vault.chunks(dir).enumerated() {
                guard Int(file.deletingPathExtension().lastPathComponent)==seq else { throw MeetingError.integrity }
                let audio=try Data(contentsOf:file);let hash=SHA256.hash(data:audio).map { String(format:"%02x",$0) }.joined()
                let ackFile=file.deletingPathExtension().appendingPathExtension("ack")
                if !FileManager.default.fileExists(atPath:ackFile.path) {
                    let ack=try await request(path+"/chunks/\(seq)",method:"PUT",body:audio,headers:["Content-Type":"application/octet-stream","X-SHA256":hash,"X-Duration":String(Double(audio.count-44)/32000)])
                    guard ack["durable"] as? Bool == true,ack["seq"] as? Int==seq,ack["size"] as? Int==audio.count,ack["sha256"] as? String==hash else { throw MeetingError.integrity }
                    try Vault.save(try JSONSerialization.data(withJSONObject:ack),to:ackFile)
                }
                manifest.append(["seq":seq,"sha256":hash,"size":audio.count])
            }
            let end=dir.appendingPathComponent("end.json")
            if closedAtStart,!manifest.isEmpty {
                var payload=try JSONSerialization.jsonObject(with:Data(contentsOf:end)) as! [String:Any];payload["manifest"]=manifest
                let ack=try await request(path+"/finalize",method:"POST",body:JSONSerialization.data(withJSONObject:payload),headers:["Content-Type":"application/json"])
                guard ack["state"] as? String=="sealed" else { throw MeetingError.integrity }
                try Vault.save(try JSONSerialization.data(withJSONObject:ack),to:dir.appendingPathComponent("sealed.json"))
                verified=true
            } else { unfinished=true }
            let result=try await request(path)
            try Vault.save(try JSONSerialization.data(withJSONObject:result),to:dir.appendingPathComponent("result.json"))
        }
        return verified && !unfinished
    }
}

final class Recorder: ObservableObject {
    @Published var active=false
    @Published var paused=false
    @Published var status="Lista para grabar"
    @Published var sessions:[URL]=[]
    private let engine=AVAudioEngine()
    private let queue=DispatchQueue(label:"mx.yod.audio-journal")
    private var dir:URL?
    private var raw:URL?
    private var file:FileHandle?
    private var sequence=0
    private var bytes=0
    private var syncBytes=0
    private var accepting=false
    private let uploader=Uploader()
    init() {
        do { try Vault.recover() } catch { status="Hay audio recuperable que requiere revisión. No borres la app." }
        sessions=Vault.list()
        NotificationCenter.default.addObserver(forName:AVAudioSession.interruptionNotification,object:nil,queue:.main) { [weak self] _ in self?.stop(interrupted:true) }
        NotificationCenter.default.addObserver(forName:AVAudioSession.routeChangeNotification,object:nil,queue:.main) { [weak self] notice in
            if let reason=notice.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,reason==AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue { self?.stop(interrupted:true) }
        }
    }
    func newFile() throws {
        raw=dir!.appendingPathComponent(String(format:"%05d.pcm",sequence))
        try Vault.save(Data(),to:raw!);file=try FileHandle(forWritingTo:raw!);bytes=0;syncBytes=0
    }
    func start(project:String) {
        guard !active,project.range(of:"^[A-Za-z0-9_-]{1,100}$",options:.regularExpression) != nil else { status="Selecciona el identificador del proyecto.";return }
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            DispatchQueue.main.async { if granted { self.begin(project:project) } else { self.status="Autoriza el micrófono en Ajustes." } }
        }
    }
    private func begin(project:String) {
        guard !active else { return }
        do {
            let space=try Vault.root.resourceValues(forKeys:[.volumeAvailableCapacityForImportantUsageKey]).volumeAvailableCapacityForImportantUsage ?? 0
            guard space>100*1024*1024 else { throw MeetingError.space }
            let session=AVAudioSession.sharedInstance();try session.setCategory(.record,mode:.default,options:[]);try session.setActive(true)
            let id=UUID().uuidString.lowercased();dir=Vault.root.appendingPathComponent(id,isDirectory:true)
            try FileManager.default.createDirectory(at:dir!,withIntermediateDirectories:true)
            try Vault.save(try JSONEncoder().encode(Meeting(id:id,project:project,mime:"audio/wav",format:"wav_segments")),to:dir!.appendingPathComponent("meeting.json"))
            sequence=0;try newFile()
            let input=engine.inputNode;let source=input.outputFormat(forBus:0)
            guard let target=AVAudioFormat(commonFormat:.pcmFormatInt16,sampleRate:16000,channels:1,interleaved:true),let converter=AVAudioConverter(from:source,to:target) else { throw MeetingError.audio }
            accepting=true;paused=false
            input.installTap(onBus:0,bufferSize:4096,format:source) { [weak self] buffer,_ in
                guard let self else { return }
                let capacity=AVAudioFrameCount(Double(buffer.frameLength)*16000/source.sampleRate+32)
                guard let converted=AVAudioPCMBuffer(pcmFormat:target,frameCapacity:capacity) else { return }
                var supplied=false;var error:NSError?
                converter.convert(to:converted,error:&error) { _,state in
                    if supplied { state.pointee = .noDataNow;return nil };supplied=true;state.pointee = .haveData;return buffer
                }
                guard error==nil,let pointer=converted.int16ChannelData?[0] else { DispatchQueue.main.async { self.stop(interrupted:true) };return }
                let data=Data(bytes:pointer,count:Int(converted.frameLength)*2)
                self.queue.async {
                    guard self.accepting else { return }
                    do {
                        try self.file?.write(contentsOf:data);self.bytes+=data.count;self.syncBytes+=data.count
                        if self.syncBytes>=32000 { try self.file?.synchronize();self.syncBytes=0 }
                        if self.bytes>=960000 {
                            try self.file?.synchronize();try self.file?.close();try Vault.wav(self.raw!)
                            self.sequence+=1;try self.newFile()
                            DispatchQueue.main.async { self.refresh();self.sync() }
                        }
                    } catch { self.accepting=false;DispatchQueue.main.async { self.stop(interrupted:true) } }
                }
            }
            try engine.start();active=true;status="Grabando. Mantén el indicador del micrófono visible; una llamada puede interrumpir.";refresh()
        } catch { stop(interrupted:true);status="No se pudo iniciar o conservar audio: revisa micrófono y espacio." }
    }
    func pause() { guard active else { return };paused.toggle();queue.sync { accepting = !paused };status=paused ? "En pausa" : "Grabando" }
    func stop(interrupted:Bool=false) {
        guard dir != nil else { return }
        engine.stop();engine.inputNode.removeTap(onBus:0)
        queue.sync {
            accepting=false
            do {
                try file?.synchronize();try file?.close();file=nil
                if let raw { try Vault.wav(raw) }
                try Vault.save(Data("{\"interrupted\":\(interrupted)}".utf8),to:dir!.appendingPathComponent("end.json"))
            } catch { DispatchQueue.main.async { self.status="Guardado incompleto: conserva la app y exporta los archivos." } }
        }
        try? AVAudioSession.sharedInstance().setActive(false)
        active=false;paused=false;dir=nil;status=interrupted ? "Grabación interrumpida; revisa lo conservado." : "Audio guardado en este iPhone. Respaldo por verificar."
        refresh();sync()
    }
    func refresh() { sessions=Vault.list() }
    func sync() {
        Task {
            do { let verified=try await uploader.sync();await MainActor.run { self.refresh();if verified && !self.active { self.status="Respaldo comprobado. Drive se verifica por separado." } } }
            catch { await MainActor.run { if !self.active { self.status="Respaldo pendiente. El audio permanece en este teléfono." } } }
        }
    }
}

@main struct YodReunionesApp: App {
    @StateObject private var recorder=Recorder()
    @State private var project=""
    @State private var server=""
    @State private var token=""
    @State private var connection=""
    @State private var exportURL:URL?
    @Environment(\.scenePhase) private var phase
    var body:some Scene {
        WindowGroup {
            NavigationStack {
                Form {
                    Section("Proyecto") { TextField("Identificador del expediente",text:$project).disabled(recorder.active);Text("Avisa a los participantes antes de grabar.");Text(recorder.status)
                        Button("Grabar reunión") { recorder.start(project:project) }.disabled(recorder.active)
                        Button(recorder.paused ? "Continuar" : "Pausar") { recorder.pause() }.disabled(!recorder.active)
                        Button("Finalizar") { recorder.stop() }.disabled(!recorder.active)
                    }
                    Section("Respaldo privado") {
                        TextField("https://servidor-del-despacho",text:$server).textInputAutocapitalization(.never).autocorrectionDisabled()
                        SecureField("Credencial de este dispositivo",text:$token)
                        Button("Conectar y respaldar") {
                            do {
                                guard let url=URL(string:server),url.scheme=="https",url.user==nil,url.password==nil,url.query==nil,url.fragment==nil,token.count>=24 else { throw MeetingError.authentication }
                                _=try Vault.connection(JSONSerialization.data(withJSONObject:["server":server,"token":token]));token="";connection="Credencial guardada en el llavero del iPhone.";recorder.sync()
                            } catch { connection="Revisa servidor y credencial." }
                        };Text(connection)
                    }
                    Section("Audio conservado") {
                        ForEach(recorder.sessions,id:\.self) { dir in
                            VStack(alignment:.leading) {
                                Text(dir.lastPathComponent).font(.caption)
                                Text("\(Vault.chunks(dir).count) fragmentos locales")
                                Text(Vault.feedback(dir)).font(.caption)
                                if FileManager.default.fileExists(atPath:dir.appendingPathComponent("sealed.json").path) { Text("Audio verificado en servidor") }
                                Button("Preparar copia del audio conservado") {
                                    Task {
                                        do { exportURL=try await Task.detached(priority:.userInitiated) { try Vault.export(dir) }.value }
                                        catch { connection="No se pudo preparar la copia; los originales permanecen guardados." }
                                    }
                                }
                            }
                        }
                        if let exportURL { ShareLink(item:exportURL) { Text("Guardar o compartir copia preparada") } }
                    }
                }.navigationTitle("YOD · Reuniones")
            }.onChange(of:phase) { value in if value == .active { recorder.refresh();recorder.sync() } }
             .onReceive(Timer.publish(every:30,on:.main,in:.common).autoconnect()) { _ in recorder.sync() }
             .onOpenURL { url in
                 guard !recorder.active,url.scheme=="yodmeeting",url.host=="record",
                       let value=URLComponents(url:url,resolvingAgainstBaseURL:false)?.queryItems?.first(where: { $0.name=="case_id" })?.value,
                       value.range(of:"^[A-Za-z0-9_-]{1,100}$",options:.regularExpression) != nil else { return }
                 project=value // Navigation never starts microphone capture or grants server access.
             }
        }
    }
}

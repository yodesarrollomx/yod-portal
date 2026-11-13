import XCTest
@testable import YodReuniones

final class VaultTests:XCTestCase {
    func testWavExportPreservesAllSamples() throws {
        let dir=FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString,isDirectory:true)
        try FileManager.default.createDirectory(at:dir,withIntermediateDirectories:true)
        defer { try? FileManager.default.removeItem(at:dir) }
        let one=Data(repeating:12,count:32000),two=Data(repeating:24,count:16000)
        for (i,data) in [one,two].enumerated() {
            let raw=dir.appendingPathComponent(String(format:"%05d.pcm",i))
            try Vault.save(data,to:raw);try Vault.wav(raw)
        }
        let exported=try Vault.export(dir);defer { try? FileManager.default.removeItem(at:exported) }
        let bytes=try Data(contentsOf:exported)
        XCTAssertEqual(bytes.count,48044)
        XCTAssertEqual(Data(bytes.prefix(4)),Data("RIFF".utf8))
        XCTAssertEqual(Data(bytes.dropFirst(44)),one+two)
        XCTAssertEqual(try Data(contentsOf:dir.appendingPathComponent("00000.pcm")),one)
    }
    func testExportRejectsMissingFragment() throws {
        let dir=FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString,isDirectory:true)
        try FileManager.default.createDirectory(at:dir,withIntermediateDirectories:true)
        defer { try? FileManager.default.removeItem(at:dir) }
        let raw=dir.appendingPathComponent("00001.pcm")
        try Vault.save(Data(repeating:0,count:320),to:raw);try Vault.wav(raw)
        XCTAssertThrowsError(try Vault.export(dir))
    }
}

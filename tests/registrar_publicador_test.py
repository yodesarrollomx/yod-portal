"""Pruebas aisladas: nunca registran Apps ni llaman a GitHub."""
import contextlib
import copy
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import urlopen

spec = importlib.util.spec_from_file_location("registration", Path(__file__).resolve().parents[1] / "scripts/registrar-publicador.py")
reg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reg)


def app():
    return {"id": 123, "slug": "synthetic-publisher", "owner": {"login": reg.ORG, "type": "Organization"},
            "permissions": {**reg.PERMISSIONS, "metadata": "read"}, "events": [],
            "pem": "-----BEGIN PRIVATE KEY-----\nU1lOVEhFVElD\n-----END PRIVATE KEY-----\n",
            "client_secret": "DO-NOT-SAVE", "webhook_secret": "DO-NOT-SAVE"}


class RegistrationTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.directory = reg.private_directory(Path(self.tmp.name) / "private")
        self.calls = []
        self.clock = [100]

    def session(self, converter=None):
        def fake(code):
            self.calls.append(code)
            return app()
        return reg.Registration(self.directory, converter or fake, lambda: self.clock[0])

    def query(self, session):
        return "code=" + "a" * 40 + "&state=" + session.state

    def test_manifest_is_private_scoped_and_has_no_user_oauth(self):
        m = reg.manifest("http://127.0.0.1:1234")
        self.assertEqual(m["default_permissions"], {"contents": "read", "pull_requests": "write"})
        self.assertFalse(m["public"])
        self.assertFalse(m["request_oauth_on_install"])
        self.assertFalse(m["hook_attributes"]["active"])
        self.assertEqual(m["default_events"], [])
        self.assertEqual(m["redirect_url"], "http://127.0.0.1:1234/callback")

    def test_wrong_missing_duplicate_or_malformed_values_never_exchange(self):
        s = self.session()
        for q in ["", "code=" + "a" * 40 + "&state=wrong", self.query(s) + "&state=duplicate",
                  self.query(s).replace("a" * 40, "../escape"), self.query(s) + "&code=" + "b" * 40]:
            with self.assertRaises(ValueError):
                s.finish(q)
        self.assertEqual(self.calls, [])
        self.assertEqual(list(self.directory.iterdir()), [])

    def test_expiry_prevents_conversion(self):
        s = self.session()
        self.clock[0] += reg.TTL
        with self.assertRaises(ValueError):
            s.finish(self.query(s))
        self.assertFalse(self.calls)

    def test_registration_saves_only_needed_fields_and_rejects_replay(self):
        s = self.session()
        self.assertEqual(s.finish(self.query(s)), "https://github.com/apps/synthetic-publisher/installations/new")
        with self.assertRaises(ValueError):
            s.finish(self.query(s))
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(self.directory.stat().st_mode & 0o777, 0o700)
        for p in self.directory.iterdir():
            self.assertEqual(p.stat().st_mode & 0o777, 0o600)
            self.assertNotIn("DO-NOT-SAVE", p.read_text())
        saved = json.loads((self.directory / "registration.json").read_text())
        self.assertFalse(saved["installation_verified"])
        self.assertEqual(saved["repositories"], ["aurum-board", "sala-edicion"])

    def test_unexpected_owner_permissions_slug_or_key_never_save(self):
        for change in [{"owner": {"login": "other", "type": "Organization"}},
                       {"permissions": {**reg.PERMISSIONS, "actions": "write"}},
                       {"slug": '../evil"'}, {"pem": "not-a-key"}, {"events": ["push"]}]:
            value = {**copy.deepcopy(app()), **change}
            s = self.session(lambda _: value)
            with self.assertRaises(ValueError):
                s.finish(self.query(s))
        self.assertEqual(list(self.directory.iterdir()), [])

    def test_failed_exchange_cannot_be_replayed(self):
        def fail(code):
            self.calls.append(code)
            raise RuntimeError("SECRET-ERROR-BODY")
        s = self.session(fail)
        with self.assertRaises(RuntimeError):
            s.finish(self.query(s))
        with self.assertRaises(ValueError):
            s.finish(self.query(s))
        self.assertEqual(len(self.calls), 1)

    def test_cannot_write_inside_checkout_reuse_or_follow_symlink(self):
        repo = Path(self.tmp.name) / "repo"
        repo.mkdir()
        (repo / ".git").write_text("gitdir: elsewhere")
        with self.assertRaises(ValueError):
            reg.private_directory(repo / "private")
        with self.assertRaises(FileExistsError):
            reg.private_directory(self.directory)
        link = Path(self.tmp.name) / "link"
        link.symlink_to(self.directory)
        with self.assertRaises(ValueError):
            reg.private_directory(link)

    def test_http_errors_and_logs_never_reveal_callback_or_exception(self):
        def fail(_):
            raise RuntimeError("SECRET-ERROR-BODY")
        s = self.session(fail)
        server = reg.HTTPServer(("127.0.0.1", 0), reg.handler_for(s))
        self.addCleanup(server.server_close)
        output = io.StringIO()
        origin = "http://127.0.0.1:" + str(server.server_port)
        with contextlib.redirect_stderr(output), contextlib.redirect_stdout(output):
            thread = threading.Thread(target=server.handle_request)
            thread.start()
            with self.assertRaises(HTTPError) as caught:
                urlopen(origin + "/callback?" + self.query(s), timeout=3)
            thread.join(3)
            self.assertFalse(thread.is_alive())
            response = caught.exception.read().decode()
        for secret in [s.state, "a" * 40, "SECRET-ERROR-BODY"]:
            self.assertNotIn(secret, output.getvalue() + response)
        self.assertEqual(caught.exception.headers["Cache-Control"], "no-store")


if __name__ == "__main__":
    unittest.main()

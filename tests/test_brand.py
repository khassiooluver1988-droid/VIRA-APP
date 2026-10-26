"""Verificações locais de integridade da marca do VIRA (sem Flutter)."""
import hashlib
import unittest
from pathlib import Path
from PIL import Image, ImageSequence

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets' / 'branding'

class BrandingTests(unittest.TestCase):
    def test_logo_original_intocada(self):
        original = ASSETS / 'vira_original_inalterada.jpg'
        self.assertTrue(original.is_file())
        self.assertEqual(hashlib.sha256(original.read_bytes()).hexdigest(),
                         '6e9ab73afec796644697945c7f2a41ed3ac4737b128c42ec09c19ce7038cc52f')

    def test_logo_transparente(self):
        with Image.open(ASSETS / 'vira_logo_transparente.png') as img:
            self.assertEqual(img.mode, 'RGBA')
            self.assertEqual(img.getpixel((0, 0))[3], 0)
            self.assertGreater(max(img.getchannel('A').getextrema()), 200)

    def test_assets_camadas(self):
        for name in ('vira_simbolo.png', 'vira_nome.png', 'vira_slogan.png'):
            with self.subTest(name=name), Image.open(ASSETS / name) as img:
                self.assertEqual(img.mode, 'RGBA')
                self.assertEqual(img.size[0], img.size[1])
                self.assertEqual(img.getpixel((0, 0))[3], 0)

    def test_motion_webp_animado(self):
        with Image.open(ASSETS / 'vira_intro_transparente.webp') as img:
            self.assertTrue(getattr(img, 'is_animated', False))
            self.assertGreater(img.n_frames, 2)
            img.seek(0)
            self.assertEqual(img.convert('RGBA').getpixel((0, 0))[3], 0)

    def test_motion_apng_animado(self):
        with Image.open(ASSETS / 'vira_intro_transparente.apng') as img:
            self.assertTrue(getattr(img, 'is_animated', False))
            self.assertGreater(img.n_frames, 2)
            img.seek(0)
            self.assertEqual(img.convert('RGBA').getpixel((0, 0))[3], 0)

if __name__ == '__main__':
    unittest.main()

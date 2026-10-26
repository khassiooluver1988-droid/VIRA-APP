"""Verificações estáticas. Não substituem flutter test nem testes reais no Supabase."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class ProjectStructureTests(unittest.TestCase):
    def test_estrutura_flutter(self):
        dart = (ROOT / 'lib/main.dart').read_text()
        manifest = (ROOT / 'pubspec.yaml').read_text()
        self.assertIn('ViraSplash', dart)
        self.assertIn('ViraHome', dart)
        for label in ('Início', 'Descobrir', 'Criar', 'Resolver', 'Perfil'):
            self.assertIn(label, dart)
        for asset in ('vira_simbolo.png', 'vira_nome.png', 'vira_slogan.png'):
            self.assertIn(asset, dart)
            self.assertIn(asset, manifest)

    def test_migration_rls(self):
        sql = (ROOT / 'supabase/migrations/0001_vira_mvp.sql').read_text().lower()
        for table in ('profiles', 'posts', 'comments', 'post_likes',
                      'help_requests', 'help_answers', 'reports'):
            self.assertIn(f'create table public.{table}', sql)
            self.assertIn(f'alter table public.{table} enable row level security', sql)
        self.assertIn('with check ((select auth.uid()) = author_id)', sql)
        self.assertIn('with check ((select auth.uid()) = id)', sql)
        self.assertIn('grant insert on public.reports to authenticated', sql)
        self.assertNotIn('grant select on public.reports to authenticated', sql)

    def test_no_secret_in_code(self):
        for path in [ROOT / 'lib/main.dart', ROOT / 'README.md',
                     ROOT / 'supabase/migrations/0001_vira_mvp.sql']:
            content = path.read_text()
            self.assertNotIn('sb_secret_', content)
            self.assertNotIn('service_role_key=', content.lower())

if __name__ == '__main__':
    unittest.main()

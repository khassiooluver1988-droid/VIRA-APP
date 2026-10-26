import 'package:flutter/material.dart';

// VIRA • MVP demonstrativo local — sem autenticação ou banco conectado.
// As três imagens preservam os pixels da marca original, com fundo removido.
const Color viraPurple = Color(0xFF7B1FFF);
const Color viraOrange = Color(0xFFFF9414);
const Color viraBlack = Color(0xFF070609);

void main() => runApp(const ViraApp());

class ViraApp extends StatelessWidget {
  const ViraApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'VIRA', debugShowCheckedModeBanner: false,
    theme: ThemeData(
      useMaterial3: true, brightness: Brightness.dark,
      scaffoldBackgroundColor: viraBlack,
      colorScheme: ColorScheme.fromSeed(seedColor: viraPurple, brightness: Brightness.dark)
          .copyWith(primary: viraPurple, secondary: viraOrange, surface: const Color(0xFF19121F)),
      appBarTheme: const AppBarTheme(backgroundColor: viraBlack, foregroundColor: Colors.white),
    ),
    home: const ViraSplash(),
  );
}

class ViraSplash extends StatefulWidget {
  const ViraSplash({super.key});
  @override
  State<ViraSplash> createState() => _ViraSplashState();
}

class _ViraSplashState extends State<ViraSplash> with SingleTickerProviderStateMixin {
  late final AnimationController controller;
  @override
  void initState() {
    super.initState();
    controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 2850))
      ..forward().whenComplete(() {
        if (!mounted) return;
        Navigator.of(context).pushReplacement(MaterialPageRoute<void>(builder: (_) => const ViraHome()));
      });
  }

  Widget layer(String path, double begin, double end, {double offsetY = 0.04}) {
    final animation = CurvedAnimation(parent: controller, curve: Interval(begin, end, curve: Curves.easeOutCubic));
    return FadeTransition(
      opacity: animation,
      child: AnimatedBuilder(animation: animation, child: Image.asset(path, fit: BoxFit.contain),
        builder: (context, child) => Transform.translate(
          offset: Offset(0, (1 - animation.value) * MediaQuery.sizeOf(context).width * offsetY),
          child: child)),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(child: AspectRatio(aspectRatio: 1, child: Stack(fit: StackFit.expand, children: [
      layer('assets/branding/vira_simbolo.png', 0.04, 0.43, offsetY: 0.055),
      layer('assets/branding/vira_nome.png', 0.26, 0.65),
      layer('assets/branding/vira_slogan.png', 0.56, 0.82, offsetY: 0.02),
    ]))),
  );
  @override
  void dispose() { controller.dispose(); super.dispose(); }
}

class ViraHelpRequest {
  ViraHelpRequest({required this.title, required this.description});
  final String title;
  final String description;
  bool resolved = false;
}

class ViraHome extends StatefulWidget {
  const ViraHome({super.key});
  @override
  State<ViraHome> createState() => _ViraHomeState();
}

class _ViraHomeState extends State<ViraHome> {
  int selectedIndex = 0;
  final List<ViraHelpRequest> requests = [];

  Future<void> openRequestForm() async {
    final title = TextEditingController();
    final detail = TextEditingController();
    try {
      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        backgroundColor: const Color(0xFF1E1625),
        builder: (sheetContext) => Padding(
          padding: EdgeInsets.fromLTRB(20, 24, 20, MediaQuery.viewInsetsOf(sheetContext).bottom + 24),
          child: SingleChildScrollView(child: Column(
            mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Novo pedido de ajuda', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextField(controller: title, maxLength: 120,
                decoration: const InputDecoration(labelText: 'Título', border: OutlineInputBorder())),
              const SizedBox(height: 12),
              TextField(controller: detail, maxLines: 3, maxLength: 3000,
                decoration: const InputDecoration(labelText: 'Explique sua necessidade', border: OutlineInputBorder())),
              const SizedBox(height: 12),
              FilledButton(onPressed: () {
                final t = title.text.trim();
                final d = detail.text.trim();
                if (t.length < 5 || d.length < 10) {
                  ScaffoldMessenger.of(sheetContext).showSnackBar(const SnackBar(
                    content: Text('Use um título com 5+ caracteres e descrição com 10+ caracteres.')));
                  return;
                }
                setState(() {
                  requests.insert(0, ViraHelpRequest(title: t, description: d));
                  selectedIndex = 3;
                });
                Navigator.pop(sheetContext);
              }, child: const Text('Publicar pedido (demonstração)')),
              const SizedBox(height: 8),
              const Text('Este pedido fica somente na memória do aparelho até fechar o app.',
                style: TextStyle(color: Colors.white70, fontSize: 12)),
            ],
          )),
        ),
      );
    } finally {
      title.dispose();
      detail.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      const _FeedPage(),
      const _DiscoverPage(),
      _CreatePage(onCreateRequest: openRequestForm),
      _RequestsPage(requests: requests, onAddRequest: openRequestForm,
        onResolve: (request) => setState(() => request.resolved = true)),
      const _ProfilePage(),
    ];
    return Scaffold(
      appBar: AppBar(title: const Text('VIRA', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2)),
        actions: [IconButton(onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Busca será ativada após a integração com o Supabase.'))), icon: const Icon(Icons.search))]),
      body: SafeArea(child: pages[selectedIndex]),
      bottomNavigationBar: NavigationBar(
        height: 74, backgroundColor: const Color(0xFF171019), indicatorColor: viraPurple.withValues(alpha: .25),
        selectedIndex: selectedIndex, onDestinationSelected: (value) => setState(() => selectedIndex = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.smart_display_outlined), selectedIcon: Icon(Icons.smart_display), label: 'Início'),
          NavigationDestination(icon: Icon(Icons.explore_outlined), selectedIcon: Icon(Icons.explore), label: 'Descobrir'),
          NavigationDestination(icon: Icon(Icons.add_circle_outline), selectedIcon: Icon(Icons.add_circle), label: 'Criar'),
          NavigationDestination(icon: Icon(Icons.handshake_outlined), selectedIcon: Icon(Icons.handshake), label: 'Resolver'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Perfil'),
        ],
      ),
    );
  }
}

class _Page extends StatelessWidget {
  final String title, description;
  final List<(IconData, String, String)> cards;
  const _Page(this.title, this.description, this.cards);
  @override
  Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(20), children: [
    Text(title, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
    const SizedBox(height: 8), Text(description, style: TextStyle(color: Colors.white.withValues(alpha: 0.68))),
    const SizedBox(height: 22),
    for (final (icon, name, body) in cards) Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Container(padding: const EdgeInsets.all(18), decoration: BoxDecoration(
        color: const Color(0xFF1E1625), borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF392B42))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, size: 32, color: viraOrange), const SizedBox(height: 12),
          Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 6), Text(body, style: TextStyle(color: Colors.white.withValues(alpha: 0.72))),
        ])),
    ),
    const SizedBox(height: 12), const Text('DEMONSTRAÇÃO LOCAL • Ainda sem contas, vídeos ou publicações reais.',
      style: TextStyle(color: Colors.white54, fontSize: 11)),
  ]);
}

class _FeedPage extends StatelessWidget { const _FeedPage(); @override Widget build(BuildContext context) =>
  const _Page('Para você', 'Assista, conecte-se, resolva.', [
    (Icons.play_circle, 'Vídeos da comunidade', 'Espaço reservado para vídeos curtos e criadores locais.'),
    (Icons.lightbulb, 'Ideias que ajudam', 'Conteúdos de utilidade prática podem virar respostas no VIRA Resolve.'),
  ]); }
class _DiscoverPage extends StatelessWidget { const _DiscoverPage(); @override Widget build(BuildContext context) =>
  const _Page('Descobrir', 'Talentos e oportunidades por interesse.', [
    (Icons.mic, 'Criadores e talentos', 'Conheça pessoas e habilidades.'),
    (Icons.storefront, 'Negócios próximos', 'Área prevista para expansão, após validar o piloto.'),
  ]); }
class _CreatePage extends StatelessWidget {
  final VoidCallback onCreateRequest;
  const _CreatePage({required this.onCreateRequest});
  @override Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(20), children: [
      Text('Criar', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
      const SizedBox(height: 8),
      const Text('O que você quer compartilhar?'),
      const SizedBox(height: 24),
      FilledButton.icon(onPressed: onCreateRequest, icon: const Icon(Icons.handshake),
        label: const Text('Pedir ajuda')),
      const SizedBox(height: 14),
      OutlinedButton.icon(onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Publicar vídeo será liberado após integrar a mídia.'))),
        icon: const Icon(Icons.video_call), label: const Text('Publicar vídeo (em preparação)')),
      const SizedBox(height: 20),
      const Text('DEMONSTRAÇÃO LOCAL • Não envia dados ao servidor.',
        style: TextStyle(color: Colors.white54, fontSize: 11)),
    ],
  );
}

class _RequestsPage extends StatelessWidget {
  const _RequestsPage({required this.requests, required this.onAddRequest, required this.onResolve});
  final List<ViraHelpRequest> requests;
  final VoidCallback onAddRequest;
  final ValueChanged<ViraHelpRequest> onResolve;

  @override Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(20), children: [
      Text('VIRA Resolve', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
      const SizedBox(height: 8),
      const Text('Transforme perguntas em possibilidades reais.'),
      const SizedBox(height: 16),
      FilledButton.icon(onPressed: onAddRequest, icon: const Icon(Icons.add),
        label: const Text('Novo pedido')),
      const SizedBox(height: 16),
      if (requests.isEmpty) const Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: Column(children: [
          Icon(Icons.handshake_outlined, size: 50, color: viraOrange),
          SizedBox(height: 16),
          Text('Nenhum pedido criado nesta sessão.'),
          SizedBox(height: 8),
          Text('Experimente publicar uma necessidade para testar o fluxo.'),
        ]),
      ),
      for (final request in requests) Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: Padding(padding: const EdgeInsets.all(16), child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(request.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8), Text(request.description),
            const SizedBox(height: 12),
            Text(request.resolved ? 'Resolvido' : 'Aberto',
              style: TextStyle(color: request.resolved ? Colors.greenAccent : viraOrange)),
            if (!request.resolved)
              TextButton(onPressed: () => onResolve(request),
                child: const Text('Marcar como resolvido')),
          ],
        )),
      ),
      const SizedBox(height: 8),
      const Text('DEMONSTRAÇÃO LOCAL • Pedidos não são publicados na internet.',
        style: TextStyle(color: Colors.white54, fontSize: 11)),
    ],
  );
}
class _ProfilePage extends StatelessWidget { const _ProfilePage(); @override Widget build(BuildContext context) =>
  const _Page('Meu perfil', 'Sua presença e suas contribuições.', [
    (Icons.person, 'Perfil VIRA', 'Cadastro, biografia e habilidades serão conectados ao Supabase.'),
    (Icons.shield_outlined, 'Privacidade e segurança', 'Denúncias, exclusão de conta e controles são requisitos para o piloto público.'),
  ]); }

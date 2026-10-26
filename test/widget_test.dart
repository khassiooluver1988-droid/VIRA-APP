import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vira/main.dart';

void main() {
  testWidgets('splash, abas e pedido de ajuda local', (tester) async {
    await tester.pumpWidget(const ViraApp());
    expect(find.byType(ViraSplash), findsOneWidget);
    await tester.pump(const Duration(milliseconds: 3000));
    await tester.pumpAndSettle();
    expect(find.text('Para você'), findsOneWidget);
    expect(find.byType(NavigationBar), findsOneWidget);

    await tester.tap(find.text('Criar'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Pedir ajuda'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).at(0), 'Preciso de ajuda');
    await tester.enterText(find.byType(TextField).at(1), 'Quero uma dica para divulgar meu pequeno negócio.');
    await tester.testTextInput.hide();
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Publicar pedido (demonstração)'));
    await tester.tap(find.text('Publicar pedido (demonstração)'));
    await tester.pumpAndSettle();
    expect(find.text('VIRA Resolve'), findsOneWidget);
    expect(find.text('Preciso de ajuda'), findsOneWidget);
    await tester.tap(find.text('Marcar como resolvido'));
    await tester.pumpAndSettle();
    expect(find.text('Resolvido'), findsOneWidget);
  });
}

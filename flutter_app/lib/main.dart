import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/products_provider.dart';
import 'providers/plans_provider.dart';
import 'providers/subscriptions_provider.dart';
import 'providers/invoices_provider.dart';
import 'providers/payments_provider.dart';
import 'providers/contacts_provider.dart';
import 'providers/taxes_provider.dart';
import 'providers/discounts_provider.dart';
import 'providers/quotations_provider.dart';
import 'providers/users_provider.dart';
import 'providers/attributes_provider.dart';
import 'providers/reports_provider.dart';
import 'providers/portal_provider.dart';
import 'providers/cart_provider.dart';
import 'app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ProductsProvider()),
        ChangeNotifierProvider(create: (_) => PlansProvider()),
        ChangeNotifierProvider(create: (_) => SubscriptionsProvider()),
        ChangeNotifierProvider(create: (_) => InvoicesProvider()),
        ChangeNotifierProvider(create: (_) => PaymentsProvider()),
        ChangeNotifierProvider(create: (_) => ContactsProvider()),
        ChangeNotifierProvider(create: (_) => TaxesProvider()),
        ChangeNotifierProvider(create: (_) => DiscountsProvider()),
        ChangeNotifierProvider(create: (_) => QuotationsProvider()),
        ChangeNotifierProvider(create: (_) => UsersProvider()),
        ChangeNotifierProvider(create: (_) => AttributesProvider()),
        ChangeNotifierProvider(create: (_) => ReportsProvider()),
        ChangeNotifierProvider(create: (_) => PortalProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: const SidazApp(),
    ),
  );
}

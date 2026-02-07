import 'package:flutter/material.dart';
import 'config/theme.dart';
import 'config/constants.dart';
import 'screens/splash_screen.dart';
import 'screens/role_selection_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/signup_screen.dart';
import 'screens/auth/reset_password_screen.dart';
import 'screens/dashboard/dashboard_shell.dart';
import 'screens/dashboard/subscription_detail_screen.dart';
import 'screens/dashboard/subscription_form_screen.dart';
import 'screens/dashboard/invoice_detail_screen.dart';
import 'screens/portal/portal_shell.dart';
import 'screens/portal/catalog_screen.dart';
import 'screens/portal/cart_screen.dart';
import 'screens/portal/checkout_screen.dart';
import 'screens/portal/confirmation_screen.dart';
import 'screens/portal/portal_subscription_detail_screen.dart';
import 'screens/portal/portal_invoice_detail_screen.dart';
import 'screens/portal/portal_payments_screen.dart';

class SidazApp extends StatelessWidget {
  const SidazApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      initialRoute: '/',
      routes: {
        '/': (_) => const SplashScreen(),
        '/role-selection': (_) => const RoleSelectionScreen(),
        '/login': (_) => const LoginScreen(),
        '/signup': (_) => const SignupScreen(),
        '/reset-password': (_) => const ResetPasswordScreen(),
        // Dashboard
        '/dashboard': (_) => const DashboardShell(),
        '/dashboard/subscription-form': (_) => const SubscriptionFormScreen(),
        // Portal
        '/portal': (_) => const PortalShell(),
        '/portal/catalog': (_) => const CatalogScreen(),
        '/portal/cart': (_) => const CartScreen(),
        '/portal/checkout': (_) => const CheckoutScreen(),
        '/portal/confirmation': (_) => const ConfirmationScreen(),
        '/portal/payments': (_) => const PortalPaymentsScreen(),
      },
      onGenerateRoute: (settings) {
        // Routes that need arguments
        if (settings.name == '/dashboard/subscription-detail') {
          final id = settings.arguments as String;
          return MaterialPageRoute(
            builder: (_) => SubscriptionDetailScreen(subscriptionId: id),
          );
        }
        if (settings.name == '/dashboard/invoice-detail') {
          final id = settings.arguments as String;
          return MaterialPageRoute(
            builder: (_) => InvoiceDetailScreen(invoiceId: id),
          );
        }
        if (settings.name == '/portal/subscription-detail') {
          final id = settings.arguments as String;
          return MaterialPageRoute(
            builder: (_) => PortalSubscriptionDetailScreen(subscriptionId: id),
          );
        }
        if (settings.name == '/portal/invoice-detail') {
          final id = settings.arguments as String;
          return MaterialPageRoute(
            builder: (_) => PortalInvoiceDetailScreen(invoiceId: id),
          );
        }
        return null;
      },
    );
  }
}

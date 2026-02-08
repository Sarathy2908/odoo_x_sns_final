import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import 'portal_home_screen.dart';
import 'portal_subscriptions_screen.dart';
import 'portal_invoices_screen.dart';
import 'profile_screen.dart';

class PortalShell extends StatefulWidget {
  const PortalShell({super.key});

  @override
  State<PortalShell> createState() => _PortalShellState();
}

class _PortalShellState extends State<PortalShell> {
  int _currentIndex = 0;
  final _titles = ['Home', 'Subscriptions', 'Invoices', 'Profile'];

  @override
  void initState() {
    super.initState();
    // Role guard: redirect dashboard users away from portal
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthProvider>().user;
      if (user == null) {
        Navigator.pushNamedAndRemoveUntil(context, '/role-selection', (_) => false);
      } else if (user.isDashboardUser) {
        Navigator.pushNamedAndRemoveUntil(context, '/dashboard', (_) => false);
      }
    });
  }

  final _screens = const [
    PortalHomeScreen(),
    PortalSubscriptionsScreen(),
    PortalInvoicesScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_currentIndex]),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          if (_currentIndex == 0)
            Consumer<CartProvider>(
              builder: (context, cart, child) {
                return Stack(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.shopping_cart),
                      onPressed: () =>
                          Navigator.pushNamed(context, '/portal/cart'),
                    ),
                    if (cart.itemCount > 0)
                      Positioned(
                        right: 6,
                        top: 6,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: AppColors.danger,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            '${cart.itemCount}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
        ],
      ),
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textSecondary,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(
              icon: Icon(Icons.subscriptions), label: 'Subscriptions'),
          BottomNavigationBarItem(
              icon: Icon(Icons.receipt_long), label: 'Invoices'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

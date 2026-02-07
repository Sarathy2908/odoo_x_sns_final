import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../providers/auth_provider.dart';
import 'home_screen.dart';
import 'products_screen.dart';
import 'plans_screen.dart';
import 'subscriptions_screen.dart';
import 'invoices_screen.dart';
import 'payments_screen.dart';
import 'contacts_screen.dart';
import 'quotations_screen.dart';
import 'taxes_screen.dart';
import 'discounts_screen.dart';
import 'attributes_screen.dart';
import 'users_screen.dart';
import 'reports_screen.dart';

class DashboardShell extends StatefulWidget {
  const DashboardShell({super.key});

  @override
  State<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends State<DashboardShell> {
  int _selectedIndex = 0;

  static const _menuItems = [
    _MenuItem('Dashboard', Icons.dashboard),
    _MenuItem('Contacts', Icons.people),
    _MenuItem('Products', Icons.inventory_2),
    _MenuItem('Subscriptions', Icons.subscriptions),
    _MenuItem('Quotations', Icons.request_quote),
    _MenuItem('Invoices', Icons.receipt_long),
    _MenuItem('Payments', Icons.payment),
    _MenuItem('Reports', Icons.bar_chart),
  ];

  static const _configItems = [
    _MenuItem('Plans', Icons.event_repeat),
    _MenuItem('Attributes', Icons.tune),
    _MenuItem('Discounts', Icons.local_offer),
    _MenuItem('Taxes', Icons.account_balance),
    _MenuItem('Users', Icons.manage_accounts),
  ];

  final List<Widget> _screens = const [
    HomeScreen(),
    ContactsScreen(),
    ProductsScreen(),
    SubscriptionsScreen(),
    QuotationsScreen(),
    InvoicesScreen(),
    PaymentsScreen(),
    ReportsScreen(),
    PlansScreen(),
    AttributesScreen(),
    DiscountsScreen(),
    TaxesScreen(),
    UsersScreen(),
  ];

  String get _currentTitle {
    final allItems = [..._menuItems, ..._configItems];
    if (_selectedIndex < allItems.length) {
      return allItems[_selectedIndex].label;
    }
    return AppConstants.appName;
  }

  void _onItemSelected(int index) {
    setState(() => _selectedIndex = index);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_currentTitle),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      drawer: _buildDrawer(),
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      child: Column(
        children: [
          _buildDrawerHeader(),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                ..._menuItems.asMap().entries.map((entry) {
                  return _buildDrawerItem(
                    entry.value,
                    entry.key,
                  );
                }),
                const Divider(),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                  child: Text(
                    'CONFIGURATION',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textSecondary.withValues(alpha: 0.7),
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                ..._configItems.asMap().entries.map((entry) {
                  return _buildDrawerItem(
                    entry.value,
                    entry.key + _menuItems.length,
                  );
                }),
              ],
            ),
          ),
          const Divider(height: 1),
          _buildLogoutButton(),
        ],
      ),
    );
  }

  Widget _buildDrawerHeader() {
    final user = context.read<AuthProvider>().user;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 20,
        left: 20,
        right: 20,
        bottom: 20,
      ),
      decoration: const BoxDecoration(color: AppColors.primary),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Logo
          Container(
            height: 40,
            alignment: Alignment.centerLeft,
            child: Image.asset(
              'assets/logo.png',
              height: 40,
              fit: BoxFit.contain,
            ),
          ),
          const SizedBox(height: 20),
          // User info row
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
                child: Text(
                  (user?.name ?? 'U')[0].toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?.name ?? 'User',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      user?.email ?? '',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 12,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              // Role badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  user?.isAdmin == true
                      ? 'Admin'
                      : user?.isInternal == true
                          ? 'Internal'
                          : 'Portal',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem(_MenuItem item, int index) {
    final isSelected = _selectedIndex == index;
    return ListTile(
      leading: Icon(
        item.icon,
        color: isSelected ? AppColors.primary : AppColors.textSecondary,
        size: 22,
      ),
      title: Text(
        item.label,
        style: TextStyle(
          color: isSelected ? AppColors.primary : AppColors.textPrimary,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
          fontSize: 14,
        ),
      ),
      selected: isSelected,
      selectedTileColor: AppColors.primary.withValues(alpha: 0.08),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
      dense: true,
      onTap: () => _onItemSelected(index),
    );
  }

  Widget _buildLogoutButton() {
    return SafeArea(
      child: ListTile(
        leading: const Icon(Icons.logout, color: AppColors.danger, size: 22),
        title: const Text(
          'Logout',
          style: TextStyle(
            color: AppColors.danger,
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        dense: true,
        onTap: () async {
          await context.read<AuthProvider>().logout();
          if (context.mounted) {
            Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
          }
        },
      ),
    );
  }
}

class _MenuItem {
  final String label;
  final IconData icon;

  const _MenuItem(this.label, this.icon);
}

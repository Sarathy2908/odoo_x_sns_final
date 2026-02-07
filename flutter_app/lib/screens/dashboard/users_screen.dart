import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/users_provider.dart';
import '../../models/user.dart';
import '../../utils/enums.dart';
import '../../utils/responsive.dart';
import '../../utils/validators.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/form_bottom_sheet.dart';
import '../../widgets/status_badge.dart';

class UsersScreen extends StatefulWidget {
  const UsersScreen({super.key});

  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<UsersProvider>().fetchAll());
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<UsersProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.items.isEmpty) {
          return const LoadingSpinner();
        }

        if (provider.items.isEmpty) {
          return EmptyState(
            icon: Icons.manage_accounts,
            title: 'No users yet',
            subtitle: 'Users will appear here',
            actionLabel: 'Add User',
            onAction: () => _showForm(context),
          );
        }

        return Scaffold(
          body: RefreshIndicator(
            onRefresh: () => provider.fetchAll(),
            child: ListView.builder(
              padding: EdgeInsets.all(Responsive.horizontalPadding(context)),
              itemCount: provider.items.length,
              itemBuilder: (context, index) {
                return _buildCard(provider.items[index]);
              },
            ),
          ),
          floatingActionButton: FloatingActionButton(
            heroTag: 'fab_users',
            onPressed: () => _showForm(context),
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }

  Widget _buildCard(User user) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: () => _showForm(context, item: user),
        leading: CircleAvatar(
          backgroundColor: _getRoleColor(user.role).withValues(alpha: 0.15),
          child: Text(
            user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
            style: TextStyle(
              color: _getRoleColor(user.role),
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                user.name,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
              ),
            ),
            StatusBadge(status: user.role.name),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 2),
            Text(
              user.email,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: _getRoleColor(user.role).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _getRoleLabel(user.role),
                style: TextStyle(
                  color: _getRoleColor(user.role),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getRoleColor(UserRole role) {
    switch (role) {
      case UserRole.ADMIN:
        return AppColors.primary;
      case UserRole.INTERNAL_USER:
        return AppColors.accent;
      case UserRole.PORTAL_USER:
        return AppColors.warning;
    }
  }

  String _getRoleLabel(UserRole role) {
    switch (role) {
      case UserRole.ADMIN:
        return 'Admin';
      case UserRole.INTERNAL_USER:
        return 'Internal User';
      case UserRole.PORTAL_USER:
        return 'Portal User';
    }
  }

  void _showForm(BuildContext context, {User? item}) {
    final nameCtrl = TextEditingController(text: item?.name ?? '');
    final emailCtrl = TextEditingController(text: item?.email ?? '');
    final passwordCtrl = TextEditingController();
    UserRole selectedRole = item?.role ?? UserRole.INTERNAL_USER;
    FormBottomSheet.show(
      context,
      title: item == null ? 'New User' : 'Edit User',
      child: StatefulBuilder(
        builder: (context, setSheetState) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(
                label: 'Name',
                controller: nameCtrl,
                validator: (v) => Validators.required(v, 'Name'),
                prefixIcon: Icons.person,
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Email',
                controller: emailCtrl,
                validator: (v) => Validators.email(v),
                keyboardType: TextInputType.emailAddress,
                prefixIcon: Icons.email,
                enabled: item == null, // Cannot change email on edit
              ),
              if (item == null) ...[
                const SizedBox(height: 14),
                AppTextField(
                  label: 'Password',
                  controller: passwordCtrl,
                  validator: (v) => Validators.password(v),
                  obscureText: true,
                  prefixIcon: Icons.lock,
                ),
              ],
              const SizedBox(height: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Role',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<UserRole>(
                    value: selectedRole,
                    items: UserRole.values.map((r) {
                      return DropdownMenuItem(
                        value: r,
                        child: Text(_getRoleLabel(r)),
                      );
                    }).toList(),
                    onChanged: (v) {
                      if (v != null) setSheetState(() => selectedRole = v);
                    },
                    decoration: const InputDecoration(
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              AppButton(
                label: item == null ? 'Create' : 'Update',
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty) return;
                  if (item == null && emailCtrl.text.trim().isEmpty) return;
                  final provider = context.read<UsersProvider>();
                  final data = <String, dynamic>{
                    'name': nameCtrl.text.trim(),
                    'role': selectedRole.name,
                  };
                  if (item == null) {
                    data['email'] = emailCtrl.text.trim();
                    data['password'] = passwordCtrl.text;
                  }
                  bool success;
                  if (item == null) {
                    success = await provider.create(data);
                  } else {
                    success = await provider.update(item.id, data);
                  }
                  if (success && context.mounted) Navigator.pop(context);
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

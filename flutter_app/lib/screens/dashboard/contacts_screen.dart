import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/contacts_provider.dart';
import '../../models/contact.dart';
import '../../utils/enums.dart';
import '../../utils/responsive.dart';
import '../../utils/validators.dart';
import '../../widgets/loading_spinner.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/form_bottom_sheet.dart';
import '../../widgets/confirm_dialog.dart';
import '../../widgets/status_badge.dart';

class ContactsScreen extends StatefulWidget {
  const ContactsScreen({super.key});

  @override
  State<ContactsScreen> createState() => _ContactsScreenState();
}

class _ContactsScreenState extends State<ContactsScreen> {
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<ContactsProvider>().fetchAll());
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ContactsProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading && provider.items.isEmpty) {
          return const LoadingSpinner();
        }

        if (provider.items.isEmpty) {
          return EmptyState(
            icon: Icons.people,
            title: 'No contacts yet',
            subtitle: 'Add your first contact to get started',
            actionLabel: 'Add Contact',
            onAction: () => _showForm(context),
          );
        }

        final filtered = provider.items.where((c) {
          if (_searchQuery.isEmpty) return true;
          return c.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              (c.email ?? '').toLowerCase().contains(_searchQuery.toLowerCase()) ||
              (c.phone ?? '').contains(_searchQuery);
        }).toList();

        return Scaffold(
          body: RefreshIndicator(
            onRefresh: () => provider.fetchAll(),
            child: Column(
              children: [
                _buildSearchBar(),
                Expanded(
                  child: ListView.builder(
                    padding: EdgeInsets.all(Responsive.horizontalPadding(context)),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      return _buildCard(filtered[index]);
                    },
                  ),
                ),
              ],
            ),
          ),
          floatingActionButton: FloatingActionButton(
            heroTag: 'fab_contacts',
            onPressed: () => _showForm(context),
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: TextField(
        decoration: InputDecoration(
          hintText: 'Search contacts...',
          prefixIcon: const Icon(Icons.search, size: 20),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, size: 20),
                  onPressed: () => setState(() => _searchQuery = ''),
                )
              : null,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
        onChanged: (v) => setState(() => _searchQuery = v),
      ),
    );
  }

  Widget _buildCard(Contact contact) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: () => _showForm(context, item: contact),
        onLongPress: () => _confirmDelete(contact),
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
          child: Text(
            contact.name.isNotEmpty ? contact.name[0].toUpperCase() : '?',
            style: const TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                contact.name,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
              ),
            ),
            StatusBadge(status: contact.type.name),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (contact.email != null && contact.email!.isNotEmpty) ...[
              const SizedBox(height: 2),
              Row(
                children: [
                  const Icon(Icons.email, size: 13, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      contact.email!,
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
            if (contact.phone != null && contact.phone!.isNotEmpty) ...[
              const SizedBox(height: 2),
              Row(
                children: [
                  const Icon(Icons.phone, size: 13, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    contact.phone!,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                ],
              ),
            ],
            if (contact.city != null && contact.city!.isNotEmpty) ...[
              const SizedBox(height: 2),
              Row(
                children: [
                  const Icon(Icons.location_on, size: 13, color: AppColors.textSecondary),
                  const SizedBox(width: 4),
                  Text(
                    contact.city!,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showForm(BuildContext context, {Contact? item}) {
    final nameCtrl = TextEditingController(text: item?.name ?? '');
    final emailCtrl = TextEditingController(text: item?.email ?? '');
    final phoneCtrl = TextEditingController(text: item?.phone ?? '');
    final streetCtrl = TextEditingController(text: item?.street ?? '');
    final cityCtrl = TextEditingController(text: item?.city ?? '');
    final stateCtrl = TextEditingController(text: item?.state ?? '');
    final postalCtrl = TextEditingController(text: item?.postalCode ?? '');
    final countryCtrl = TextEditingController(text: item?.country ?? '');
    final companyCtrl = TextEditingController(text: item?.companyName ?? '');
    ContactType selectedType = item?.type ?? ContactType.INDIVIDUAL;

    FormBottomSheet.show(
      context,
      title: item == null ? 'New Contact' : 'Edit Contact',
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
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Type',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<ContactType>(
                    value: selectedType,
                    items: ContactType.values.map((t) {
                      return DropdownMenuItem(value: t, child: Text(t.name));
                    }).toList(),
                    onChanged: (v) {
                      if (v != null) setSheetState(() => selectedType = v);
                    },
                    decoration: const InputDecoration(
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Email',
                controller: emailCtrl,
                keyboardType: TextInputType.emailAddress,
                prefixIcon: Icons.email,
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Phone',
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                prefixIcon: Icons.phone,
              ),
              if (selectedType == ContactType.COMPANY) ...[
                const SizedBox(height: 14),
                AppTextField(
                  label: 'Company',
                  controller: companyCtrl,
                  prefixIcon: Icons.business,
                ),
              ],
              const SizedBox(height: 14),
              AppTextField(label: 'Street', controller: streetCtrl),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(child: AppTextField(label: 'City', controller: cityCtrl)),
                  const SizedBox(width: 12),
                  Expanded(child: AppTextField(label: 'State', controller: stateCtrl)),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(child: AppTextField(label: 'Postal Code', controller: postalCtrl)),
                  const SizedBox(width: 12),
                  Expanded(child: AppTextField(label: 'Country', controller: countryCtrl)),
                ],
              ),
              const SizedBox(height: 20),
              AppButton(
                label: item == null ? 'Create' : 'Update',
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty) return;
                  final provider = context.read<ContactsProvider>();
                  final data = {
                    'name': nameCtrl.text.trim(),
                    'email': emailCtrl.text.trim(),
                    'phone': phoneCtrl.text.trim(),
                    'contactType': selectedType.name,
                    'street': streetCtrl.text.trim(),
                    'city': cityCtrl.text.trim(),
                    'state': stateCtrl.text.trim(),
                    'postalCode': postalCtrl.text.trim(),
                    'country': countryCtrl.text.trim(),
                    'companyName': companyCtrl.text.trim(),
                  };
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

  void _confirmDelete(Contact contact) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Delete Contact',
      message: 'Are you sure you want to delete "${contact.name}"?',
      confirmText: 'Delete',
      confirmColor: AppColors.danger,
    );
    if (confirmed == true && mounted) {
      context.read<ContactsProvider>().delete(contact.id);
    }
  }
}

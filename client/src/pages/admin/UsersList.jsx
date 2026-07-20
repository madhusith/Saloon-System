import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';

export const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentUser, setCurrentUser] = useState(null);

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userRole, setUserRole] = useState('CUSTOMER');
  const [userStatus, setUserStatus] = useState('ACTIVE');
  // Profile fields
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Temporary password display modal
  const [tempPassModalOpen, setTempPassModalOpen] = useState(false);
  const [tempPassData, setTempPassData] = useState({ email: '', password: '', message: '' });

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', {
        params: {
          page,
          limit,
          search: search || undefined,
          role: role || undefined,
          status: status || undefined
        }
      });
      if (res.data && res.data.success) {
        setUsers(res.data.data.users);
        setTotal(res.data.data.meta.total);
        setTotalPages(res.data.data.meta.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, role, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormError('');
    setFormSuccess('');
    setFullName('');
    setEmail('');
    setPhone('');
    setUserRole('CUSTOMER');
    setUserStatus('ACTIVE');
    setSpecialization('');
    setExperienceYears(0);
    setBio('');
    setAddress('');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = async (user) => {
    setModalMode('edit');
    setFormError('');
    setFormSuccess('');
    setCurrentUser(user);
    setFullName(user.full_name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setUserRole(user.role);
    setUserStatus(user.status);

    // Load profile
    try {
      const res = await api.get(`/users/${user.id}`);
      if (res.data && res.data.success) {
        const profile = res.data.data.profile;
        if (profile) {
          setSpecialization(profile.specialization || '');
          setExperienceYears(profile.experience_years || 0);
          setBio(profile.bio || '');
          setAddress(profile.address || '');
          setNotes(profile.notes || '');
        } else {
          setSpecialization('');
          setExperienceYears(0);
          setBio('');
          setAddress('');
          setNotes('');
        }
      }
    } catch (err) {
      console.warn('Failed to load user profile details:', err);
    }

    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setActionLoading(true);

    try {
      if (modalMode === 'create') {
        const payload = {
          fullName,
          email,
          phone,
          role: userRole,
          status: userStatus
        };

        if (userRole === 'STAFF') {
          payload.specialization = specialization;
          payload.experienceYears = Number(experienceYears);
          payload.bio = bio;
        } else if (userRole === 'CUSTOMER') {
          payload.address = address;
          payload.notes = notes;
        }

        const res = await api.post('/users', payload);
        if (res.data && res.data.success) {
          // Success welcomes email temporary password
          // Extract message or welcome notification
          setModalOpen(false);
          // Show temporary password modal
          const mockMsg = res.data.message;
          const tempP = mockMsg.includes('Temp_')
            ? mockMsg.substring(mockMsg.indexOf('Temp_'))
            : 'Check server verification details or email log.';

          setTempPassData({
            email,
            password: tempP,
            message: res.data.message
          });
          setTempPassModalOpen(true);
          fetchUsers();
        }
      } else {
        // Edit mode
        const userPayload = { fullName, email, phone };
        const profilePayload = {};
        
        if (userRole === 'STAFF') {
          profilePayload.specialization = specialization;
          profilePayload.experienceYears = Number(experienceYears);
          profilePayload.bio = bio;
        } else if (userRole === 'CUSTOMER') {
          profilePayload.address = address;
          profilePayload.notes = notes;
        }

        const res = await api.patch(`/users/${currentUser.id}`, {
          ...userPayload,
          ...profilePayload
        });

        if (res.data && res.data.success) {
          setFormSuccess('User updated successfully.');
          setTimeout(() => {
            setModalOpen(false);
            fetchUsers();
          }, 1500);
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await api.patch(`/users/${id}/status`, { status: newStatus });
      if (res.data && res.data.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleResetPassword = async (id, userEmail) => {
    if (!window.confirm(`Are you sure you want to reset password for ${userEmail}?`)) return;

    try {
      const res = await api.post(`/users/${id}/reset-password`);
      if (res.data && res.data.success) {
        // Displays confirmation or generated password if logged
        alert(res.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const handleDeleteUser = async (id, userName) => {
    if (!window.confirm(`Are you sure you want to soft-delete ${userName}? This action can be undone only via database.`)) return;

    try {
      const res = await api.delete(`/users/${id}`);
      if (res.data && res.data.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage all customer, cashier, stylist, and system administrator accounts.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-lg bg-pink-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 shadow-sm transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mr-2 h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-9-4.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM18.75 18.75a8.967 8.967 0 01-2.312-6.022c.007-.018.017-.036.025-.054A8.92 8.92 0 0118.75 12c0 3.02-.977 5.81-2.635 8.082m-1.53-3.07a8.954 8.954 0 01-6.18-6.18m11.13 6.18h-11.13" />
          </svg>
          Add New User
        </button>
      </div>

      {/* Filter Options */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Search Users</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-pink-500 focus:outline-none"
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="absolute left-3 top-2.5 h-5 w-5 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>

          <div className="w-full md:w-48">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Role Filter</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="STAFF">Stylist / Staff</option>
              <option value="CASHIER">Cashier</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="w-full md:w-48">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Status Filter</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-700 border-t-transparent"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center space-y-2">
            <p className="text-base font-medium text-slate-500">No users found.</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Name & Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-950">{u.full_name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                        u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        u.role === 'CASHIER' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        u.role === 'STAFF' ? 'bg-pink-50 text-pink-700 border border-pink-100' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.status}
                        onChange={(e) => handleStatusChange(u.id, e.target.value)}
                        className={`rounded border px-2 py-1 text-xs font-semibold focus:outline-none ${
                          u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                          u.status === 'INACTIVE' ? 'bg-slate-50 text-slate-600 border-slate-300' :
                          'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Edit User"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleResetPassword(u.id, u.email)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Reset Password"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.full_name)}
                          className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          title="Delete User"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
            <span className="text-xs text-slate-500">Showing page {page} of {totalPages} ({total} total users)</span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-slate-50 px-6">
              <h3 className="text-base font-bold text-slate-950 capitalize">{modalMode} User Account</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleFormSubmit}>
              <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
                {formError && (
                  <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-100">{formError}</div>
                )}
                {formSuccess && (
                  <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-100">{formSuccess}</div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      required
                      disabled={modalMode === 'edit'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Account Role</label>
                    <select
                      disabled={modalMode === 'edit'}
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="STAFF">Stylist / Staff</option>
                      <option value="CASHIER">Cashier</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Account Status</label>
                    <select
                      value={userStatus}
                      onChange={(e) => setUserStatus(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                </div>

                {/* DYNAMIC PROFILE INPUTS */}
                {userRole === 'STAFF' && (
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-pink-600 uppercase tracking-wider">Stylist Profile Information</h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Specialization</label>
                        <input
                          type="text"
                          placeholder="e.g. Coloring, Perms, Cuts"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Experience (Years)</label>
                        <input
                          type="number"
                          min="0"
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Biography</label>
                        <textarea
                          rows="3"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {userRole === 'CUSTOMER' && (
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-pink-600 uppercase tracking-wider">Customer Profile Information</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Address</label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Customer Notes</label>
                        <textarea
                          rows="3"
                          placeholder="Preferences, allergies, notes..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex rounded-lg bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Temporary Password Display Modal */}
      {tempPassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-pink-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">User Created successfully</h3>
            <p className="text-sm text-slate-500">
              A temporary password has been sent to <strong>{tempPassData.email}</strong>.
            </p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Temporary Password (Log View)</span>
              <span className="text-lg font-bold text-slate-900 tracking-wider font-mono">{tempPassData.password || 'Check email logs'}</span>
            </div>
            <button
              onClick={() => setTempPassModalOpen(false)}
              className="inline-flex w-full justify-center rounded-lg bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default UsersList;

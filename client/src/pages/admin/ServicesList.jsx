import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';

export const ServicesList = () => {
  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentService, setCurrentService] = useState(null);

  // Staff assignment modal state
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [allStaff, setAllStaff] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceCategory, setServiceCategory] = useState('HAIR');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [price, setPrice] = useState(1000);
  const [imageUrl, setImageUrl] = useState('');
  const [serviceStatus, setServiceStatus] = useState('ACTIVE');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch services
  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/services', {
        params: {
          page,
          limit,
          search: search || undefined,
          category: category || undefined,
          status: status || undefined
        }
      });
      if (res.data && res.data.success) {
        setServices(res.data.data.services);
        setTotal(res.data.data.meta.total);
        setTotalPages(res.data.data.meta.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all staff members (stylists)
  const fetchAllStaff = async () => {
    try {
      const res = await api.get('/staff');
      if (res.data && res.data.success) {
        setAllStaff(res.data.data.staff);
      }
    } catch (error) {
      console.error('Failed to fetch staff members:', error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [page, category, status]);

  useEffect(() => {
    fetchAllStaff();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchServices();
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormError('');
    setFormSuccess('');
    setName('');
    setDescription('');
    setServiceCategory('HAIR');
    setDurationMinutes(30);
    setPrice(1000);
    setImageUrl('');
    setServiceStatus('ACTIVE');
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setModalMode('edit');
    setFormError('');
    setFormSuccess('');
    setCurrentService(service);
    setName(service.name);
    setDescription(service.description || '');
    setServiceCategory(service.category);
    setDurationMinutes(service.duration_minutes);
    setPrice(Number(service.price));
    setImageUrl(service.image_url || '');
    setServiceStatus(service.status);
    setModalOpen(true);
  };

  const openStaffModal = async (service) => {
    setCurrentService(service);
    setSelectedStaffIds([]);
    setStaffModalOpen(true);
    setAssignLoading(true);

    try {
      const res = await api.get(`/services/${service.id}`);
      if (res.data && res.data.success) {
        setSelectedStaffIds(res.data.data.assignedStaffIds || []);
      }
    } catch (err) {
      console.error('Failed to load assigned staff:', err);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setActionLoading(true);

    const payload = {
      name,
      description,
      category: serviceCategory,
      durationMinutes: Number(durationMinutes),
      price: Number(price),
      imageUrl: imageUrl || null,
      status: serviceStatus
    };

    try {
      if (modalMode === 'create') {
        const res = await api.post('/services', payload);
        if (res.data && res.data.success) {
          setFormSuccess('Service created successfully.');
          setTimeout(() => {
            setModalOpen(false);
            fetchServices();
          }, 1500);
        }
      } else {
        const res = await api.patch(`/services/${currentService.id}`, payload);
        if (res.data && res.data.success) {
          setFormSuccess('Service updated successfully.');
          setTimeout(() => {
            setModalOpen(false);
            fetchServices();
          }, 1500);
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStaffAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignLoading(true);

    try {
      const res = await api.post(`/services/${currentService.id}/staff`, {
        staffIds: selectedStaffIds
      });
      if (res.data && res.data.success) {
        alert('Staff assigned successfully!');
        setStaffModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign staff.');
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleStaffSelection = (staffId) => {
    if (selectedStaffIds.includes(staffId)) {
      setSelectedStaffIds(selectedStaffIds.filter((id) => id !== staffId));
    } else {
      setSelectedStaffIds([...selectedStaffIds, staffId]);
    }
  };

  const handleDeleteService = async (id, serviceName) => {
    if (!window.confirm(`Are you sure you want to soft-delete the service "${serviceName}"?`)) return;

    try {
      const res = await api.delete(`/services/${id}`);
      if (res.data && res.data.success) {
        fetchServices();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete service.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Services Management</h1>
          <p className="mt-1 text-sm text-slate-500">Create and update hair, facial, nail, and bridal services details.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-lg bg-pink-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 shadow-sm transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mr-2 h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Service
        </button>
      </div>

      {/* Filter Options */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Search Services</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by service name or description..."
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Category Filter</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="HAIR">Hair</option>
              <option value="FACE">Face</option>
              <option value="BODY">Body</option>
              <option value="NAILS">Nails</option>
              <option value="BRIDAL">Bridal</option>
              <option value="OTHER">Other</option>
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

      {/* Services Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-700 border-t-transparent"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center space-y-2">
            <p className="text-base font-medium text-slate-500">No services found.</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Service Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {s.image_url ? (
                          <img src={s.image_url} alt={s.name} className="h-10 w-10 rounded-lg object-cover border border-slate-200" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">
                            {s.category.substring(0, 2)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-950">{s.name}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{s.description || 'No description provided.'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 border border-slate-200">
                        {s.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">{s.duration_minutes} mins</td>
                    <td className="px-6 py-4 font-bold text-pink-700">LKR {Number(s.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openStaffModal(s)}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                          title="Assign Stylists"
                        >
                          Stylists
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Edit Service"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id, s.name)}
                          className="rounded p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          title="Delete Service"
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
            <span className="text-xs text-slate-500">Showing page {page} of {totalPages} ({total} total services)</span>
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

      {/* Create / Edit Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-slate-50 px-6">
              <h3 className="text-base font-bold text-slate-950 capitalize">{modalMode} Salon Service</h3>
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

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Service Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Premium Haircut"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Description</label>
                    <textarea
                      rows="3"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the treatment, tools used, skin/hair types, etc..."
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Category</label>
                      <select
                        value={serviceCategory}
                        onChange={(e) => setServiceCategory(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                      >
                        <option value="HAIR">Hair</option>
                        <option value="FACE">Face</option>
                        <option value="BODY">Body</option>
                        <option value="NAILS">Nails</option>
                        <option value="BRIDAL">Bridal</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Status</label>
                      <select
                        value={serviceStatus}
                        onChange={(e) => setServiceStatus(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Duration (Minutes)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Price (LKR)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Image URL</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>
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

      {/* Assign Staff Modal */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-slate-50 px-6">
              <div>
                <h3 className="text-base font-bold text-slate-950">Assign Stylists</h3>
                <p className="text-xs text-slate-400">{currentService?.name}</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setStaffModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleStaffAssignSubmit}>
              <div className="max-h-[60vh] overflow-y-auto p-6">
                {assignLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-700 border-t-transparent"></div>
                  </div>
                ) : allStaff.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">No staff members found. Add stylists under User Management.</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Eligible Stylists</p>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {allStaff.map((staff) => (
                        <label
                          key={staff.id}
                          className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-950">{staff.full_name}</span>
                            <span className="text-xs text-slate-500 font-medium">{staff.specialization || 'General Stylist'}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedStaffIds.includes(staff.id)}
                            onChange={() => toggleStaffSelection(staff.id)}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="inline-flex rounded-lg bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
                >
                  Save Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesList;

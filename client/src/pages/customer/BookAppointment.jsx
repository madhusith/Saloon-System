// client/src/pages/customer/BookAppointment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';

export const BookAppointment = () => {
    const navigate = useNavigate();

    // Step wizard state
    const [step, setStep] = useState(1); // 1: Services, 2: Stylist, 3: Date & Time, 4: Review

    // Lists from APIs
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);

    // Selections
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState(0); // 0 = Any Available Stylist
    const [bookingDate, setBookingDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [notes, setNotes] = useState('');

    // Statuses
    const [loading, setLoading] = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(null);

    // Fetch active services on mount
    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            try {
                const res = await api.get('/services', { params: { status: 'ACTIVE', limit: 100 } });
                if (res.data && res.data.success) {
                    setServices(res.data.data.services);
                }
            } catch (err) {
                console.error('Failed to load services:', err);
                setErrorMsg('Failed to load services. Please refresh.');
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    // Fetch eligible stylists when services are selected
    // We intersect the stylists assigned to all selected services
    const fetchEligibleStaff = async () => {
        if (selectedServices.length === 0) return;
        setLoading(true);
        try {
            // Fetch details of all selected services to get their assigned staff IDs
            const serviceDetails = await Promise.all(
                selectedServices.map((id) => api.get(`/services/${id}`))
            );

            const staffAssignments = serviceDetails.map((res) => res.data.data.assignedStaffIds || []);

            // Intersect assignments
            const eligibleIds = staffAssignments.reduce((intersection, currentList) => {
                return intersection.filter((id) => currentList.includes(id));
            }, staffAssignments[0] || []);

            // Fetch all staff and filter by intersection
            const staffRes = await api.get('/staff');
            if (staffRes.data && staffRes.data.success) {
                const matchingStaff = staffRes.data.data.staff.filter((member) =>
                    eligibleIds.includes(member.id) && member.status === 'ACTIVE'
                );
                setStaff(matchingStaff);
            }
        } catch (err) {
            console.error('Failed to resolve eligible staff:', err);
        } finally {
            setLoading(false);
        }
    };

    // Trigger staff filtering when moving to Step 2
    const handleGoToStylistStep = async () => {
        if (selectedServices.length === 0) {
            setErrorMsg('Please select at least one service.');
            return;
        }
        setErrorMsg('');
        await fetchEligibleStaff();
        setStep(2);
    };

    // Fetch available slots when Date, Stylist, or Services change
    const fetchSlots = async () => {
        if (!bookingDate || selectedServices.length === 0) return;
        setSlotsLoading(true);
        setAvailableSlots([]);
        setSelectedSlot('');
        try {
            const res = await api.get('/appointments/slots', {
                params: {
                    serviceIds: selectedServices.join(','),
                    staffId: selectedStaffId,
                    date: bookingDate
                }
            });
            if (res.data && res.data.success) {
                setAvailableSlots(res.data.data.slots);
            }
        } catch (err) {
            console.error('Failed to fetch available slots:', err);
        } finally {
            setSlotsLoading(false);
        }
    };

    useEffect(() => {
        fetchSlots();
    }, [bookingDate, selectedStaffId]);

    // Summaries
    const totalDuration = selectedServices.reduce((sum, id) => {
        const service = services.find((s) => s.id === id);
        return sum + (service?.duration_minutes || 0);
    }, 0);

    const totalPrice = selectedServices.reduce((sum, id) => {
        const service = services.find((s) => s.id === id);
        return sum + Number(service?.price || 0);
    }, 0);

    const toggleService = (id) => {
        setErrorMsg('');
        if (selectedServices.includes(id)) {
            setSelectedServices(selectedServices.filter((sid) => sid !== id));
        } else {
            setSelectedServices([...selectedServices, id]);
        }
    };

    const handleBookingSubmit = async () => {
        setBookingLoading(true);
        setErrorMsg('');
        try {
            const res = await api.post('/appointments', {
                serviceIds: selectedServices,
                staffId: selectedStaffId || null,
                appointmentDate: bookingDate,
                startTime: selectedSlot,
                notes
            });
            if (res.data && res.data.success) {
                setBookingSuccess(res.data.data.appointment);
                setStep(5); // Success step
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Booking request failed.');
        } finally {
            setBookingLoading(false);
        }
    };

    const getSelectedStylistName = () => {
        if (Number(selectedStaffId) === 0) return 'Any Available Stylist';
        const stylist = staff.find((s) => s.id === Number(selectedStaffId));
        return stylist ? stylist.full_name : 'Selected Stylist';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Book an Appointment</h1>
                <p className="mt-1 text-sm text-slate-500">Configure your premium pamper session in a few simple steps.</p>
            </div>

            {/* Progress Bar (Only show if not success step) */}
            {step < 5 && (
                <div className="flex items-center justify-between border border-slate-200 bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center space-x-2">
                        <span className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? 'bg-pink-700 text-white' : 'bg-slate-100 text-slate-500'}`}>1</span>
                        <span className="text-xs font-bold text-slate-700 hidden sm:inline">Select Services</span>
                    </div>
                    <div className="h-0.5 w-12 bg-slate-200 flex-1 mx-2"></div>
                    <div className="flex items-center space-x-2">
                        <span className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? 'bg-pink-700 text-white' : 'bg-slate-100 text-slate-500'}`}>2</span>
                        <span className="text-xs font-bold text-slate-700 hidden sm:inline">Choose Stylist</span>
                    </div>
                    <div className="h-0.5 w-12 bg-slate-200 flex-1 mx-2"></div>
                    <div className="flex items-center space-x-2">
                        <span className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-bold ${step >= 3 ? 'bg-pink-700 text-white' : 'bg-slate-100 text-slate-500'}`}>3</span>
                        <span className="text-xs font-bold text-slate-700 hidden sm:inline">Date & Time</span>
                    </div>
                    <div className="h-0.5 w-12 bg-slate-200 flex-1 mx-2"></div>
                    <div className="flex items-center space-x-2">
                        <span className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-bold ${step >= 4 ? 'bg-pink-700 text-white' : 'bg-slate-100 text-slate-500'}`}>4</span>
                        <span className="text-xs font-bold text-slate-700 hidden sm:inline">Confirm Booking</span>
                    </div>
                </div>
            )}

            {errorMsg && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-100">{errorMsg}</div>
            )}

            {/* STEP 1: SERVICES SELECTION */}
            {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-base font-bold text-slate-900 mb-4">Choose Services</h3>
                            {loading ? (
                                <div className="flex h-32 items-center justify-center">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-700 border-t-transparent"></div>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {services.map((service) => (
                                        <label
                                            key={service.id}
                                            className={`flex items-start justify-between p-4 border rounded-xl cursor-pointer hover:border-pink-300 transition-all ${selectedServices.includes(service.id) ? 'border-pink-700 bg-pink-50/20' : 'border-slate-200 bg-white'
                                                }`}
                                        >
                                            <div className="space-y-1 pr-3">
                                                <span className="block text-sm font-semibold text-slate-950">{service.name}</span>
                                                <span className="block text-xs text-slate-500 line-clamp-1">{service.description || 'Pamper session.'}</span>
                                                <span className="inline-block text-xxs font-bold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 uppercase">{service.category}</span>
                                            </div>
                                            <div className="flex flex-col items-end space-y-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedServices.includes(service.id)}
                                                    onChange={() => toggleService(service.id)}
                                                    className="h-4.5 w-4.5 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                                                />
                                                <span className="text-xs font-bold text-pink-700">LKR {Number(service.price).toLocaleString()}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart Summary */}
                    <div className="lg:col-span-1">
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6 space-y-4">
                            <h3 className="text-base font-bold text-slate-900">Selection Summary</h3>
                            <div className="divide-y divide-slate-100 text-sm space-y-2">
                                {selectedServices.map((sid) => {
                                    const s = services.find((srv) => srv.id === sid);
                                    return (
                                        <div key={sid} className="flex justify-between py-2 text-slate-800 font-medium">
                                            <span>{s?.name}</span>
                                            <span>LKR {Number(s?.price || 0).toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
                                <div className="flex justify-between font-medium text-slate-600">
                                    <span>Total Duration:</span>
                                    <span>{totalDuration} mins</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg text-slate-900">
                                    <span>Total Price:</span>
                                    <span className="text-pink-700">LKR {totalPrice.toLocaleString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleGoToStylistStep}
                                disabled={selectedServices.length === 0}
                                className="w-full inline-flex justify-center rounded-lg bg-pink-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 shadow-sm disabled:opacity-50 transition"
                            >
                                Choose Stylist →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: STYLIST SELECTION */}
            {step === 2 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                    <h3 className="text-base font-bold text-slate-900">Select Preferred Stylist</h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {/* Any Stylist Card */}
                        <div
                            onClick={() => setSelectedStaffId(0)}
                            className={`p-5 border rounded-2xl cursor-pointer hover:border-pink-300 transition-all text-center flex flex-col justify-center space-y-2 ${selectedStaffId === 0 ? 'border-pink-700 bg-pink-50/20' : 'border-slate-200 bg-white'
                                }`}
                        >
                            <div className="mx-auto h-12 w-12 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xl">💇‍♀️</div>
                            <h4 className="font-bold text-slate-900">Any Available Stylist</h4>
                            <p className="text-xs text-slate-500">Pick this for maximum time slot availability.</p>
                        </div>

                        {/* Stylists List */}
                        {staff.map((stylist) => (
                            <div
                                key={stylist.id}
                                onClick={() => setSelectedStaffId(stylist.id)}
                                className={`p-5 border rounded-2xl cursor-pointer hover:border-pink-300 transition-all text-center flex flex-col justify-center space-y-2 ${selectedStaffId === stylist.id ? 'border-pink-700 bg-pink-50/20' : 'border-slate-200 bg-white'
                                    }`}
                            >
                                <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 uppercase">
                                    {stylist.full_name.substring(0, 2)}
                                </div>
                                <h4 className="font-bold text-slate-900">{stylist.full_name}</h4>
                                <p className="text-xs text-pink-700 font-semibold uppercase tracking-wider">{stylist.specialization || 'Stylist'}</p>
                                <p className="text-xxs text-slate-400">{stylist.experience_years} years experience</p>
                            </div>
                        ))}
                    </div>

                    {staff.length === 0 && (
                        <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200 p-4 rounded-lg">
                            No specific stylist is assigned to all of your selected services. You can select "Any Available Stylist" to find a match.
                        </p>
                    )}

                    <div className="flex justify-between border-t border-slate-100 pt-4">
                        <button
                            onClick={() => setStep(1)}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="inline-flex rounded-lg bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 shadow-sm"
                        >
                            Select Date & Time →
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: DATE & TIME SELECTION */}
            {step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Calendar Picker */}
                    <div className="md:col-span-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
                        <h3 className="text-base font-bold text-slate-900 mb-4">Choose Booking Date</h3>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Select Date</label>
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Slots Picker */}
                    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 mb-2">Select Time Slot</h3>
                        <p className="text-xs text-slate-400 mb-4">Showing available slots for {getSelectedStylistName()} on {bookingDate || 'selected date'}.</p>

                        {slotsLoading ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-700 border-t-transparent"></div>
                            </div>
                        ) : !bookingDate ? (
                            <p className="text-center text-sm text-slate-500 py-8">Select a booking date to load available hours.</p>
                        ) : availableSlots.length === 0 ? (
                            <p className="text-center text-sm text-slate-500 py-8">No slots available for this day. Try another date or stylist.</p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                                {availableSlots.map((slot) => (
                                    <button
                                        key={slot}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all ${selectedSlot === slot
                                                ? 'bg-pink-700 border-pink-700 text-white shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-800 hover:border-pink-200'
                                            }`}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between border-t border-slate-100 pt-6 mt-6">
                            <button
                                onClick={() => setStep(2)}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(4)}
                                disabled={!selectedSlot || !bookingDate}
                                className="inline-flex rounded-lg bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 shadow-sm disabled:opacity-50"
                            >
                                Confirm Details →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 4: REVIEW & CONFIRM */}
            {step === 4 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 max-w-2xl mx-auto">
                    <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Review Booking Details</h3>

                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-3 py-2 border-b border-slate-50">
                            <span className="font-semibold text-slate-400 uppercase tracking-wide text-xs">Services:</span>
                            <span className="col-span-2 font-bold text-slate-800">
                                {selectedServices.map((sid) => services.find((s) => s.id === sid)?.name).join(', ')}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 py-2 border-b border-slate-50">
                            <span className="font-semibold text-slate-400 uppercase tracking-wide text-xs">Stylist:</span>
                            <span className="col-span-2 font-bold text-slate-800">{getSelectedStylistName()}</span>
                        </div>

                        <div className="grid grid-cols-3 py-2 border-b border-slate-50">
                            <span className="font-semibold text-slate-400 uppercase tracking-wide text-xs">Schedule:</span>
                            <span className="col-span-2 font-bold text-slate-800">{bookingDate} @ {selectedSlot}</span>
                        </div>

                        <div className="grid grid-cols-3 py-2 border-b border-slate-50">
                            <span className="font-semibold text-slate-400 uppercase tracking-wide text-xs">Duration:</span>
                            <span className="col-span-2 font-bold text-slate-800">{totalDuration} minutes</span>
                        </div>

                        <div className="grid grid-cols-3 py-2 border-b border-slate-100">
                            <span className="font-semibold text-slate-400 uppercase tracking-wide text-xs">Total Bill:</span>
                            <span className="col-span-2 font-extrabold text-pink-700 text-lg">LKR {totalPrice.toLocaleString()}</span>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Special Requests / Notes</label>
                            <textarea
                                rows="2"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Allergies, preferences, details..."
                                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between border-t border-slate-100 pt-6">
                        <button
                            onClick={() => setStep(3)}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleBookingSubmit}
                            disabled={bookingLoading}
                            className="inline-flex rounded-lg bg-pink-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 shadow-sm disabled:opacity-50 transition"
                        >
                            {bookingLoading ? 'Securing Slot...' : 'Confirm & Book Appointment'}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 5: BOOKING SUCCESS */}
            {step === 5 && bookingSuccess && (
                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm max-w-md mx-auto text-center space-y-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-8 w-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Booking Confirmed!</h2>
                        <p className="text-sm text-slate-500">Your appointment has been successfully scheduled. We look forward to seeing you.</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Reference:</span>
                            <strong className="text-slate-900 font-mono tracking-wider">{bookingSuccess.bookingReference}</strong>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Schedule:</span>
                            <strong className="text-slate-900">{bookingSuccess.appointmentDate} @ {bookingSuccess.startTime.substring(0, 5)}</strong>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Total Price:</span>
                            <strong className="text-pink-700">LKR {Number(bookingSuccess.totalPrice).toLocaleString()}</strong>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col space-y-2">
                        <button
                            onClick={() => navigate('/customer')}
                            className="inline-flex w-full justify-center rounded-lg bg-pink-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-600 transition"
                        >
                            Go to Dashboard
                        </button>
                        <button
                            onClick={() => {
                                setSelectedServices([]);
                                setSelectedSlot('');
                                setBookingDate('');
                                setNotes('');
                                setStep(1);
                            }}
                            className="inline-flex w-full justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                            Book Another Session
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookAppointment;

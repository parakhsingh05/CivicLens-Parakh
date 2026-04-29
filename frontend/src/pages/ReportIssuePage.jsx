import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, MapPin, X, Image } from 'lucide-react';
import { issueAPI } from '../services/api';
import toast from 'react-hot-toast';
import MapComponent from "../components/MapComponent";

const CATEGORIES = [
  { id: 'Road', label: 'Road', desc: 'Potholes, broken streetlights, or signs', icon: '🛣️' },
  { id: 'Water', label: 'Water', desc: 'Leaks, pipe bursts, or quality issues', icon: '💧' },
  { id: 'Electricity', label: 'Electricity', desc: 'Power outages, sparks, or loose wires', icon: '⚡' },
  { id: 'Sanitation', label: 'Sanitation', desc: 'Garbage collection or drainage problems', icon: '🗑️' },
  { id: 'Other', label: 'Other', desc: 'Any other civic issues not listed above', icon: '📋' },
];

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const cameraRef = useRef();
  const galleryRef = useRef();

  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    photo: null,
    photoPreview: '',
    locationAddress: '',
    locationLat: '',
    locationLng: '',
  });

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setForm(prev => ({
          ...prev,
          locationLat: lat,
          locationLng: lng,
          locationAddress: prev.locationAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        }));
        setLocationLoading(false);
        toast.success('GPS location detected');
      },
      () => {
        toast.error('Could not detect location. Please type your address.');
        setLocationLoading(false);
      }
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(prev => ({
      ...prev,
      photo: file,
      photoPreview: URL.createObjectURL(file)
    }));
  };

  const removePhoto = () => {
    setForm(prev => ({ ...prev, photo: null, photoPreview: '' }));
  };

  const handleSubmit = async (isDraft = false) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('category', form.category);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('locationAddress', form.locationAddress || 'Location not specified');
      if (form.locationLat) fd.append('locationLat', form.locationLat);
      if (form.locationLng) fd.append('locationLng', form.locationLng);
      if (form.photo) fd.append('photo', form.photo);
      fd.append('draftMode', isDraft);

      const { data } = await issueAPI.create(fd);
      toast.success(isDraft ? 'Draft saved!' : 'Issue reported successfully!');
      navigate(`/track/${data.issue._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
            className="text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-primary">Report Issue</h2>
            <p className="text-xs text-gray-400">Step {step} of 3</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <div className="px-4 pb-24">

        {/* STEP 1 — Category */}
        {step === 1 && (
          <div>
            <h3 className="text-xl font-bold mb-1 text-primary">Select Category</h3>
            <p className="text-gray-500 text-sm mb-5">What type of issue are you reporting?</p>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm(prev => ({ ...prev, category: cat.id }))}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    form.category === cat.id ? 'border-primary bg-orange-50' : 'border-gray-200'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{cat.icon}</span>
                  <p className="font-semibold text-sm">{cat.label}</p>
                  <p className="text-gray-500 text-xs">{cat.desc}</p>
                </button>
              ))}
            </div>
            <button
              disabled={!form.category}
              onClick={() => setStep(2)}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2 — Details + Photo Upload */}
        {step === 2 && (
          <div>
            <h3 className="text-xl font-bold mb-1 text-primary">Issue Details</h3>
            <p className="text-gray-500 text-sm mb-5">Describe the issue and add a photo</p>

            <div className="space-y-4">
              <input
                className="input"
                placeholder="Title (e.g. Deep pothole on Main St)"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              />
              <textarea
                className="input h-28 resize-none"
                placeholder="Description — what's wrong, how bad is it?"
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              />

              {/* ── Photo Upload Grid ── */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Photo Evidence</p>

                {/* Hidden file inputs */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraRef}
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={galleryRef}
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                {!form.photoPreview ? (
                  /* Upload options grid */
                  <div className="grid grid-cols-2 gap-3">
                    {/* Take Photo */}
                    <button
                      onClick={() => cameraRef.current.click()}
                      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50 hover:border-primary hover:bg-orange-50 transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <Camera size={22} className="text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">Take Photo</p>
                      <p className="text-xs text-gray-400 text-center">Use your camera</p>
                    </button>

                    {/* Upload from Gallery */}
                    <button
                      onClick={() => galleryRef.current.click()}
                      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50 hover:border-primary hover:bg-orange-50 transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <Image size={22} className="text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">Upload Image</p>
                      <p className="text-xs text-gray-400 text-center">From gallery</p>
                    </button>
                  </div>
                ) : (
                  /* Photo Preview with remove button */
                  <div className="relative rounded-2xl overflow-hidden">
                    <img
                      src={form.photoPreview}
                      alt="Preview"
                      className="w-full h-52 object-cover"
                    />
                    {/* Geo-tag badge overlay */}
                    {form.locationLat && form.locationLng && (
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <MapPin size={11} className="text-green-400" />
                        <span>{Number(form.locationLat).toFixed(4)}, {Number(form.locationLng).toFixed(4)}</span>
                      </div>
                    )}
                    <button
                      onClick={removePhoto}
                      className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1"
                    >
                      <X size={16} />
                    </button>
                    {/* Retake option */}
                    <button
                      onClick={() => galleryRef.current.click()}
                      className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              disabled={!form.title || !form.description}
              onClick={() => { setStep(3); detectLocation(); }}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 3 — Location + Map + Geo-tag */}
        {step === 3 && (
          <div>
            <h3 className="text-xl font-bold text-primary mb-1">Confirm Location</h3>
            <p className="text-gray-500 text-sm mb-4">Pin the exact location of the issue</p>

            <input
              className="input"
              placeholder="Enter address or area"
              value={form.locationAddress}
              onChange={e => setForm(prev => ({ ...prev, locationAddress: e.target.value }))}
            />

            <button
              onClick={detectLocation}
              className="flex items-center gap-2 text-primary text-sm font-medium mt-3"
            >
              <MapPin size={15} />
              {locationLoading ? 'Detecting location...' : 'Use my GPS location'}
            </button>

            {/* Map */}
            {form.locationLat && form.locationLng ? (
              <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200">
                <MapComponent
                  lat={Number(form.locationLat)}
                  lng={Number(form.locationLng)}
                />
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-gray-100 h-44 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                <MapPin size={28} className="mb-2" />
                <p className="text-sm">Tap "Use my GPS" to show map</p>
              </div>
            )}

            {/* Geo-tagged photo preview */}
            {form.photoPreview && form.locationLat && form.locationLng && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-gray-700 mb-2">📍 Geo-tagged Photo</p>
                <div className="relative rounded-2xl overflow-hidden">
                  <img
                    src={form.photoPreview}
                    alt="Geo-tagged"
                    className="w-full h-44 object-cover"
                  />
                  {/* Geo-tag stamp */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-green-400" />
                      <span className="text-white text-xs font-mono">
                        {Number(form.locationLat).toFixed(5)}, {Number(form.locationLng).toFixed(5)}
                      </span>
                    </div>
                    <p className="text-white/70 text-xs mt-0.5">
                      {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="btn-primary w-full mt-6"
            >
              {loading ? 'Submitting...' : '🚀 Submit Issue'}
            </button>

            <button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="w-full mt-3 text-sm text-gray-400 underline"
            >
              Save as Draft
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
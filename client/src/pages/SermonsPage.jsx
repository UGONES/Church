import { useState, useEffect } from "react";
import { sermonService } from '../services/apiService';
import Loader from '../components/Loader';
import { useAlert } from '../utils/Alert';
import { Sermon } from '../models/Sermon';

const SermonsPage = ({ user }) => {
    const alert = useAlert();
    const [selectedSermon, setSelectedSermon] = useState(null);
    const [showSermonModal, setShowSermonModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [sermonFilter, setSermonFilter] = useState('all');
    const [sermons, setSermons] = useState([]);
    const [favoriteSermons, setFavoriteSermons] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [liveStatus, setLiveStatus] = useState(null);
    const [categories, setCategories] = useState([]);
    const [sermonStats, setSermonStats] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        speaker: '',
        description: '',
        category: 'faith',
        videoUrl: '',
        imageUrl: ''
    });

    const isAdmin = user?.role === "admin";
    const isAuthenticated = user?.isLoggedIn;

    useEffect(() => {
        document.title = "SMC: - Sermons | St. Michael's & All Angels Church | Ifite-Awka";
        fetchSermons();
        fetchLiveStatus();
        fetchCategories();
        if (isAuthenticated) {
            fetchUserFavorites();
        }
        if (isAdmin) {
            fetchSermonStats();
        }
    }, [isAuthenticated, isAdmin]);

    const fetchSermons = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await sermonService.getAll();
            setSermons(response.map(sermon => new Sermon(sermon)));
        } catch (error) {
            console.error('Error fetching sermons:', error);
            setError('Failed to load sermons. Please try again later.');
            alert.error('Failed to load sermons. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLiveStatus = async () => {
        try {
            const response = await sermonService.getLiveStatus();
            setLiveStatus(response);
        } catch (error) {
            console.error('Error fetching live status:', error);
            setLiveStatus(null);
            alert.error('Failed to load live status.');
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await sermonService.getCategories();
            setCategories(response);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
            alert.error('Failed to load categories.');
        }
    };

    const fetchUserFavorites = async () => {
        try {
            const response = await sermonService.getFavorites();
            setFavoriteSermons(new Set(response.map(fav => fav.sermonId || fav._id)));
        } catch (error) {
            console.error('Error fetching favorites:', error);
            alert.error('Failed to load your favorite sermons.');
        }
    };

    const fetchSermonStats = async () => {
        try {
            const response = await sermonService.getStats();
            setSermonStats(response);
        } catch (error) {
            console.error('Error fetching sermon stats:', error);
        }
    };

    const handleEditSermon = (sermon) => {
        setEditForm({
            _id: sermon._id || sermon.id,
            title: sermon.title,
            speaker: sermon.speaker,
            description: sermon.description,
            category: sermon.category,
            videoUrl: sermon.videoUrl,
            imageUrl: sermon.imageUrl
        });
        setShowEditModal(true);
    };

    const handleDeleteSermon = async (sermonId) => {
        alert.info('Are you sure you want to delete this sermon?', {
            confirm: async () => {
                try {
                    await sermonService.delete(sermonId);
                    setSermons(sermons.filter(s => s._id !== sermonId && s.id !== sermonId));
                    alert.success('Sermon deleted successfully.');
                } catch (error) {
                    console.error('Error deleting sermon:', error);
                    if (error.response?.status === 403) {
                        alert.error('Permission denied. Only admins can delete sermons.');
                    } else {
                        alert.error('Failed to delete sermon');
                    }
                }
            }
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (editForm._id) {
                response = await sermonService.update(editForm._id, editForm);
            } else {
                response = await sermonService.create({
                    ...editForm,
                    date: new Date().toISOString()
                });
            }

            const savedSermon = new Sermon(response);
            if (editForm._id) {
                setSermons(sermons.map(s => s._id === editForm._id ? savedSermon : s));
            } else {
                setSermons([...sermons, savedSermon]);
            }
            setShowEditModal(false);
            setEditForm({
                title: '',
                speaker: '',
                description: '',
                category: 'faith',
                videoUrl: '',
                imageUrl: ''
            });
            alert.success(`Sermon ${editForm._id ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('Error saving sermon:', error);
            if (error.response?.status === 403) {
                alert.error('Permission denied. Only admins can manage sermons.');
            } else {
                alert.error('Failed to save sermon');
            }
        }
    };

    const handleAddToFavorites = async (sermonId) => {
        if (!isAuthenticated) {
            alert.info('Please log in to add to favorites');
            return;
        }

        try {
            if (favoriteSermons.has(sermonId)) {
                await sermonService.removeFavorite(sermonId);
                setFavoriteSermons(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(sermonId);
                    return newSet;
                });
                alert.success('Removed from favorites!');
            } else {
                await sermonService.addFavorite(sermonId);
                setFavoriteSermons(prev => new Set(prev).add(sermonId));
                alert.success('Added to favorites!');
            }
        } catch (error) {
            console.error('Error updating favorites:', error);
            alert.error('Failed to update favorites');
        }
    };

    const handleSermonPlay = (sermon) => {
        setSelectedSermon(sermon);
        setShowSermonModal(true);
    };

    // Filter sermons based on selected category
    const filteredSermons = sermonFilter === 'all'
        ? sermons
        : sermons.filter(sermon => sermon.category === sermonFilter);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return <Loader type="spinner" text="Loading sermons..." />;
    }

    return (
        <div className="page">
            {/* Header */}
            <section className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] py-12 px-4">
                <div className="container mx-auto text-center text-white">
                    <h1 className="text-4xl font-bold mb-4">Sermons</h1>
                    <p className="text-xl max-w-2xl mx-auto">Watch or listen to recent messages from our pastors</p>

                    {/* Admin Actions */}
                    {isAdmin && (
                        <div className="mt-6">
                            <button
                                onClick={() => {
                                    setEditForm({
                                        title: '',
                                        speaker: '',
                                        description: '',
                                        category: 'faith',
                                        videoUrl: '',
                                        imageUrl: ''
                                    });
                                    setShowEditModal(true);
                                }}
                                className="bg-white text-[#FF7E45] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                            >
                                <i className="fas fa-plus mr-2"></i>Add New Sermon
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Error Message */}
            {error && (
                <div className="container mx-auto px-4 py-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            )}

            {/* Live Stream Banner */}
            <LiveStreamSection liveStatus={liveStatus} />

            {/* Sermons Section */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    {/* Filter Tabs */}
                    <div className="mb-8 flex flex-wrap justify-center gap-2">
                        <button
                            className={`px-4 py-2 rounded-full transition-colors ${sermonFilter === 'all' ? 'bg-[#FF7E45] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                            onClick={() => setSermonFilter('all')}
                        >
                            All Sermons
                        </button>
                        {categories.map(category => (
                            <button
                                key={category}
                                className={`px-4 py-2 rounded-full transition-colors ${sermonFilter === category ? 'bg-[#FF7E45] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                onClick={() => setSermonFilter(category)}
                            >
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7E45] mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading sermons...</p>
                        </div>
                    ) : (
                        <>
                            {/* Sermons Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredSermons.map((sermon) => (
                                    <SermonCard
                                        key={sermon._id || sermon.id}
                                        sermon={sermon}
                                        isAdmin={isAdmin}
                                        isFavorite={favoriteSermons.has(sermon._id) || favoriteSermons.has(sermon.id)}
                                        onEdit={handleEditSermon}
                                        onDelete={handleDeleteSermon}
                                        onFavorite={handleAddToFavorites}
                                        onPlay={handleSermonPlay}
                                        isAuthenticated={isAuthenticated}
                                        formatDate={formatDate}
                                    />
                                ))}
                            </div>

                            {filteredSermons.length === 0 && (
                                <div className="text-center py-12">
                                    <i className="fas fa-sad-tear text-4xl text-gray-400 mb-4"></i>
                                    <p className="text-gray-600">No sermons found in this category.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Sermon Modal */}
            {showSermonModal && selectedSermon && (
                <SermonModal
                    sermon={selectedSermon}
                    isFavorite={favoriteSermons.has(selectedSermon._id) || favoriteSermons.has(selectedSermon.id)}
                    onClose={() => setShowSermonModal(false)}
                    onFavorite={handleAddToFavorites}
                    isAuthenticated={isAuthenticated}
                    formatDate={formatDate}
                />
            )}

            {/* Edit Sermon Modal */}
            {showEditModal && (
                <EditSermonModal
                    editForm={editForm}
                    setEditForm={setEditForm}
                    onClose={() => setShowEditModal(false)}
                    onSubmit={handleEditSubmit}
                    categories={categories}
                />
            )}
        </div>
    );
};

// Component for Live Stream Section
const LiveStreamSection = ({ liveStatus }) => (
    <section className="bg-[#333] text-white py-8">
        <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-stretch gap-6">
                {/* Live Stream Video Area */}
                <div className="lg:w-2/3">
                    <div className="bg-black rounded-lg overflow-hidden shadow-lg">
                        <div className="w-full aspect-video relative">
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                <div className="mb-4">
                                    <div className="relative inline-block">
                                        <i className="fas fa-video text-4xl md:text-5xl text-gray-400"></i>
                                        {liveStatus?.isLive && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold mb-2">
                                    {liveStatus?.isLive ? 'Live Now' : 'Service Starts Soon'}
                                </h3>
                                <p className="text-gray-300 text-sm md:text-base mb-4">
                                    {liveStatus?.isLive
                                        ? 'Join us for live worship and teaching'
                                        : 'Live stream will begin automatically when the service starts'
                                    }
                                </p>
                                {liveStatus?.nextStream && (
                                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                                        <i className="fas fa-clock"></i>
                                        <span>Next stream: {liveStatus.nextStream}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Info Panel */}
                <div className="lg:w-1/3">
                    <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg h-full">
                        <div className="flex items-center mb-4">
                            {liveStatus?.isLive && (
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                            )}
                            <h3 className="text-xl md:text-2xl font-bold">
                                {liveStatus?.isLive ? 'Live Now' : 'Up Next'}
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <i className="fas fa-calendar-alt text-[#FF7E45] mt-1 mr-3"></i>
                                <div>
                                    <p className="font-semibold">Sunday Service</p>
                                    <p className="text-gray-300 text-sm">{new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <i className="fas fa-clock text-[#FF7E45] mt-1 mr-3"></i>
                                <div>
                                    <p className="font-semibold">9:00 AM - 10:30 AM</p>
                                    <p className="text-gray-300 text-sm">Eastern Time</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <i className="fas fa-user text-[#FF7E45] mt-1 mr-3"></i>
                                <div>
                                    <p className="font-semibold">{liveStatus?.currentSpeaker || 'Pastor Michael Johnson'}</p>
                                    <p className="text-gray-300 text-sm">"{liveStatus?.currentTopic || 'Finding Rest in a Restless World'}"</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <button className="btn bg-[#FF7E45] hover:bg-[#FFA76A] text-white w-full flex items-center justify-center">
                                <i className="fas fa-bell mr-2"></i>
                                Set Reminder
                            </button>

                            <button className="btn bg-gray-700 hover:bg-gray-600 text-white w-full flex items-center justify-center">
                                <i className="fas fa-share-alt mr-2"></i>
                                Share Stream
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

// Component for Sermon Card
const SermonCard = ({ sermon, isAdmin, isFavorite, onEdit, onDelete, onFavorite, onPlay, isAuthenticated, formatDate }) => {
    const sermonId = sermon._id || sermon.id;

    return (
        <div className="sermon-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative cursor-pointer" onClick={() => onPlay(sermon)}>
                <img src={sermon.imageUrl} alt={sermon.title} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-[#FF7E45] text-white rounded-full flex items-center justify-center">
                        <i className="fas fa-play text-2xl"></i>
                    </div>
                </div>
                {isAdmin && (
                    <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(sermon);
                            }}
                            className="bg-blue-500 text-white p-1 rounded"
                        >
                            <i className="fas fa-edit text-sm"></i>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(sermonId);
                            }}
                            className="bg-red-500 text-white p-1 rounded"
                        >
                            <i className="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                )}
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-sm text-gray-500 mb-2">{formatDate(sermon.date)}</div>
                        <h3 className="text-xl font-bold mb-2">{sermon.title}</h3>
                        <p className="text-gray-600">{sermon.speaker}</p>
                    </div>
                    {isAuthenticated && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFavorite(sermonId);
                            }}
                            className={`transition-colors ${isFavorite ? "text-[#FF7E45]" : "text-gray-400 hover:text-[#FF7E45]"
                                }`}
                        >
                            <i className={`${isFavorite ? "fas" : "far"} fa-heart`}></i>
                        </button>
                    )}
                </div>
                <div className="mt-3 flex items-center text-sm text-gray-500">
                    <span className="mr-3"><i className="fas fa-eye mr-1"></i> {sermon.views || 0}</span>
                    <span><i className="fas fa-clock mr-1"></i> {sermon.duration || '45:00'}</span>
                </div>
            </div>
        </div>
    );
};

// Component for Sermon Modal
const SermonModal = ({ sermon, isFavorite, onClose, onFavorite, isAuthenticated, formatDate }) => {
    const sermonId = sermon._id || sermon.id;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="relative">
                    <div className="aspect-w-16 aspect-h-9">
                        <iframe
                            src={sermon.videoUrl}
                            className="w-full h-64 md:h-96"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={sermon.title}
                        />
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-opacity-70">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-2xl font-bold">{sermon.title}</h3>
                            <p className="text-gray-600">{sermon.speaker} • {formatDate(sermon.date)}</p>
                        </div>
                        {isAuthenticated && (
                            <button
                                onClick={() => onFavorite(sermonId)}
                                className={`flex items-center ${isFavorite ? "text-[#FF7E45]" : "text-gray-400 hover:text-[#FF7E45]"
                                    }`}
                            >
                                <i className={`${isFavorite ? "fas" : "far"} fa-heart mr-1`}></i>
                                {isFavorite ? 'Remove from' : 'Add to'} Favorites
                            </button>
                        )}
                    </div>

                    <p className="text-gray-700 mb-6">{sermon.description}</p>

                    <div className="flex flex-wrap gap-3 mb-6">
                        <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded capitalize">{sermon.category}</span>
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded">
                            <i className="fas fa-eye mr-1"></i> {sermon.views || 0} views
                        </span>
                        <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded">
                            <i className="fas fa-thumbs-up mr-1"></i> {sermon.likes || 0} likes
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button className="btn bg-[#333] text-white hover:bg-gray-700 transition-colors">
                            <i className="fas fa-download mr-2"></i> Download Audio
                        </button>
                        <button className="btn bg-[#FF7E45] text-white hover:bg-[#FFA76A] transition-colors">
                            <i className="fas fa-share-alt mr-2"></i> Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Component for Edit Sermon Modal
const EditSermonModal = ({ editForm, setEditForm, onClose, onSubmit, categories }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">
                    {editForm._id ? 'Edit Sermon' : 'Add New Sermon'}
                </h2>

                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Title *</label>
                            <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Speaker *</label>
                            <input
                                type="text"
                                value={editForm.speaker}
                                onChange={(e) => setEditForm({ ...editForm, speaker: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Category *</label>
                            <select
                                value={editForm.category}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Image URL *</label>
                            <input
                                type="url"
                                value={editForm.imageUrl}
                                onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Description *</label>
                        <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            rows="3"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Video URL *</label>
                        <input
                            type="url"
                            value={editForm.videoUrl}
                            onChange={(e) => setEditForm({ ...editForm, videoUrl: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                            required
                            placeholder="https://www.youtube.com/embed/..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#FF7E45] text-white rounded-lg hover:bg-[#FFA76A] transition-colors"
                        >
                            {editForm._id ? 'Update' : 'Create'} Sermon
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
);

export default SermonsPage;
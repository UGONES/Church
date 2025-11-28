import Event from '../models/Event.mjs';
import RSVP from '../models/RSVP.mjs';
import Favorite from '../models/Favorite.mjs';

// ===================== GET ALL EVENTS =====================
export async function getAllEvents(req, res) {
    try {
        const { page = 1, limit = 10, category, upcoming } = req.query;
        const query = {};

        if (category) query.category = category;
        if (upcoming === 'true') query.startTime = { $gte: new Date() };

        const events = await Event.find(query)
            .sort({ startTime: 1 })
            .limit(Number(limit))
            .skip((page - 1) * Number(limit));

        const total = await Event.countDocuments(query);

        return res.json({
            success: true,
            events, // 👈 matches frontend expectation
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
        });
    } catch (error) {
        console.error('❌ Error fetching events:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error fetching events',
            error: error.message,
        });
    }
}

// Get upcoming events
export async function getUpcomingEvents(req, res) {
    try {
        const { limit = 3 } = req.query;
        // FIXED: Use Event.find() instead of find()
        const events = await Event.find({
            startTime: { $gte: new Date() },
            status: { $in: ['scheduled', 'draft'] }
        })
            .sort({ startTime: 1 })
            .limit(parseInt(limit));

        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Get user RSVPs
export async function getUserRsvps(req, res) {
    try {
        // FIXED: Use RSVP.find() instead of _find()
        const rsvps = await RSVP.find({ userId: req.user._id })
            .populate('eventId', 'title startTime location')
            .select('eventId status guests');

        res.json(rsvps);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Get user favorite events
export async function getUserFavorites(req, res) {
    try {
        // FIXED: Use Favorite.find() instead of __find()
        const favorites = await Favorite.find({
            userId: req.user._id,
            itemType: 'event'
        }).populate('itemId');

        res.json({
            success: true,
            data: favorites.map(fav => fav.itemId)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// RSVP for event
export async function rsvpForEvent(req, res) {
    try {
        const { id } = req.params;
        const { guests = 1, guestNames = [], dietaryRestrictions, specialRequests } = req.body;

        // FIXED: Use Event.findById() instead of findById()
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check capacity
        if (event.capacity > 0 && (event.registered + guests) > event.capacity) {
            return res.status(400).json({ message: 'Event is at capacity' });
        }

        // FIXED: Use RSVP.findOne() instead of findOne()
        const existingRsvp = await RSVP.findOne({
            userId: req.user._id,
            eventId: id
        });

        if (existingRsvp) {
            return res.status(400).json({ message: 'You have already RSVPed for this event' });
        }

        const rsvp = new RSVP({
            userId: req.user._id,
            eventId: id,
            guests,
            guestNames,
            dietaryRestrictions,
            specialRequests,
            status: 'confirmed'
        });

        await rsvp.save();

        // Update event registration count
        event.registered += guests;
        await event.save();

        res.status(201).json({
            message: 'RSVP submitted successfully',
            rsvp
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Cancel RSVP
export async function cancelRsvp(req, res) {
    try {
        const { id } = req.params;

        // FIXED: Use RSVP.findOneAndDelete() instead of findOneAndDelete()
        const rsvp = await RSVP.findOneAndDelete({
            userId: req.user._id,
            eventId: id
        });

        if (!rsvp) {
            return res.status(404).json({ message: 'RSVP not found' });
        }

        // Update event registration count
        // FIXED: Use Event.findById() instead of findById()
        const event = await Event.findById(id);
        if (event) {
            event.registered = Math.max(0, event.registered - rsvp.guests);
            await event.save();
        }

        res.json({ message: 'RSVP cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Add favorite event
export async function addFavoriteEvent(req, res) {
    try {
        const { id } = req.params;
        const existingFavorite = await Favorite.findOne({
            userId: req.user._id,
            itemType: 'event',
            itemId: id
        });

        if (existingFavorite) {
            return res.status(400).json({ success: false, message: 'Event already in favorites' });
        }

        const favorite = new Favorite({
            userId: req.user._id,
            itemType: 'event',
            itemId: id
        });

        await favorite.save();

        // return the created favorite/populated item
        const populated = await Favorite.findById(favorite._id).populate('itemId');
        return res.status(201).json({ success: true, favorite: populated, message: 'Event added to favorites' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Remove favorite event
export async function removeFavoriteEvent(req, res) {
    try {
        const { id } = req.params;
        const deleted = await Favorite.findOneAndDelete({
            userId: req.user._id,
            itemType: 'event',
            itemId: id
        });

        return res.json({ success: true, message: 'Event removed from favorites', favorite: deleted });
    } catch (error) {
        console.error('❌ removeFavoriteEvent error:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

// ===================== CREATE EVENT (ADMIN) =====================
export async function createEvent(req, res) {
    try {
        const eventData = req.body;

        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                eventData.imageUrl = req.files.image[0].path || req.files.image[0].secure_url || req.files.image[0].url;
            }
            if (req.files.video && req.files.video[0]) {
                eventData.videoUrl = req.files.video[0].path || req.files.video[0].secure_url || req.files.video[0].url;
            }
        }

        if (eventData.leaders) {
            eventData.leaders = JSON.parse(eventData.leaders);
        }
        if (eventData.tags) {
            eventData.tags = JSON.parse(eventData.tags);
        }

        if (!eventData.status) eventData.status = 'scheduled';

        const event = new Event(eventData);
        await event.save();
        console.log("✅ Event saved:", event._id, event.title);

        return res.status(201).json({ success: true, message: 'Event created successfully', event, });
    } catch (error) {
        console.error('❌ Event creation error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create event', error: error.message, });
    }
}

// Update event (Admin)
export async function updateEvent(req, res) {
    try {
        const { id } = req.params;
        const eventData = { ...req.body };

        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                eventData.imageUrl = req.files.image[0].path || req.files.image[0].secure_url || req.files.image[0].url;
            }
            if (req.files.video && req.files.video[0]) {
                eventData.videoUrl = req.files.video[0].path || req.files.video[0].secure_url || req.files.video[0].url;
            }
        }
        if (eventData.leaders) {
            eventData.leaders = JSON.parse(eventData.leaders);
        }
        if (eventData.tags) {
            eventData.tags = JSON.parse(eventData.tags);
        }


        const event = await Event.findByIdAndUpdate(id, eventData, { runValidators: true });

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ message: 'Event updated successfully', event });
    } catch (error) {
        console.error('❌ Event update error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });

    }
}

// Delete event (Admin)
export async function deleteEvent(req, res) {
    try {
        const { id } = req.params;
        const event = await Event.findByIdAndDelete(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        await RSVP.deleteMany({ eventId: id });
        await Favorite.deleteMany({ itemType: 'event', itemId: id });

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('❌ Event deletion error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}
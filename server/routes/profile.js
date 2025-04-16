const express = require('express');
const profileService = require('../services/profileService');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all profiles for the authenticated user (including public ones)
router.get('/', auth, async (req, res, next) => {
  try {
    const profiles = await profileService.getUserProfiles(req.user.id);
    res.json(profiles);
  } catch (err) {
    next(err);
  }
});

// Get a specific profile
router.get('/:id', auth, async (req, res, next) => {
  try {
    const profile = await profileService.getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    // If it's a user-created profile, check ownership
    if (profile.user_id && profile.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this profile' });
    }
    
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// Create a new profile
router.post('/', auth, async (req, res, next) => {
  try {
    // Add user_id to the profile data
    const profileData = {
      ...req.body,
      user_id: req.user.id
    };
    
    const newProfile = await profileService.createProfile(profileData);
    res.status(201).json(newProfile);
  } catch (err) {
    next(err);
  }
});

// Update a profile
router.put('/:id', auth, async (req, res, next) => {
  try {
    // First check if this profile belongs to the user
    const profile = await profileService.getProfileById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    // If it has a user_id and doesn't match the current user, deny access
    if (profile.user_id && profile.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this profile' });
    }
    
    // Don't allow editing of built-in profiles
    if (!profile.user_id) {
      return res.status(403).json({ message: 'Cannot modify built-in profiles' });
    }
    
    const updatedProfile = await profileService.updateProfile(req.params.id, req.body);
    res.json(updatedProfile);
  } catch (err) {
    next(err);
  }
});

// Delete a profile
router.delete('/:id', auth, async (req, res, next) => {
  try {
    // First check if this profile belongs to the user
    const profile = await profileService.getProfileById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    // If it has a user_id and doesn't match the current user, deny access
    if (profile.user_id && profile.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this profile' });
    }
    
    // Don't allow deletion of built-in profiles
    if (!profile.user_id) {
      return res.status(403).json({ message: 'Cannot delete built-in profiles' });
    }
    
    const result = await profileService.deleteProfile(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
const express = require('express');
const memoryService = require('../services/memoryService');
const auth = require('../middleware/auth');

const router = express.Router();

// Get memories for the authenticated user
router.get('/', auth, async (req, res, next) => {
  try {
    const memories = await memoryService.getUserMemories(req.user.id);
    res.json(memories);
  } catch (err) {
    next(err);
  }
});

// Get a specific memory
router.get('/:id', auth, async (req, res, next) => {
  try {
    const memory = await memoryService.getMemoryById(req.params.id);
    
    if (!memory) {
      return res.status(404).json({ message: 'Memory not found' });
    }
    
    // Check if the memory belongs to the authenticated user
    if (memory.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this memory' });
    }
    
    res.json(memory);
  } catch (err) {
    next(err);
  }
});

// Create a new memory
router.post('/', auth, async (req, res, next) => {
  try {
    // Add user_id to the memory data
    const memoryData = {
      ...req.body,
      user_id: req.user.id
    };
    
    const newMemory = await memoryService.createMemory(memoryData);
    res.status(201).json(newMemory);
  } catch (err) {
    next(err);
  }
});

// Update a memory
router.put('/:id', auth, async (req, res, next) => {
  try {
    // First check if the memory exists and belongs to the user
    const memory = await memoryService.getMemoryById(req.params.id);
    
    if (!memory) {
      return res.status(404).json({ message: 'Memory not found' });
    }
    
    if (memory.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this memory' });
    }
    
    const updatedMemory = await memoryService.updateMemory(req.params.id, req.body);
    res.json(updatedMemory);
  } catch (err) {
    next(err);
  }
});

// Delete a memory
router.delete('/:id', auth, async (req, res, next) => {
  try {
    // First check if the memory exists and belongs to the user
    const memory = await memoryService.getMemoryById(req.params.id);
    
    if (!memory) {
      return res.status(404).json({ message: 'Memory not found' });
    }
    
    if (memory.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this memory' });
    }
    
    const result = await memoryService.deleteMemory(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
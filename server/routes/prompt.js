const express = require('express');
const promptService = require('../services/promptService');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all prompts for the authenticated user
router.get('/', auth, async (req, res, next) => {
  try {
    const prompts = await promptService.getUserPrompts(req.user.id);
    res.json(prompts);
  } catch (err) {
    next(err);
  }
});

// Get a specific prompt
router.get('/:id', auth, async (req, res, next) => {
  try {
    const prompt = await promptService.getPromptById(req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }
    
    // If it's a user-created prompt, check ownership
    if (prompt.user_id && prompt.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this prompt' });
    }
    
    res.json(prompt);
  } catch (err) {
    next(err);
  }
});

// Create a new prompt
router.post('/', auth, async (req, res, next) => {
  try {
    // Add user_id to the prompt data
    const promptData = {
      ...req.body,
      user_id: req.user.id
    };
    
    const newPrompt = await promptService.createPrompt(promptData);
    res.status(201).json(newPrompt);
  } catch (err) {
    next(err);
  }
});

// Execute a prompt
router.post('/execute', auth, async (req, res, next) => {
  try {
    const result = await promptService.executePrompt(req.body);
    
    // Save the executed prompt as a memory if requested
    if (req.body.save_as_memory) {
      const memoryService = require('../services/memoryService');
      await memoryService.createMemory({
        content: result.result,
        context: {
          prompt_id: result.prompt_id,
          variables: result.variables,
          timestamp: new Date().toISOString()
        },
        user_id: req.user.id
      });
    }
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Update a prompt
router.put('/:id', auth, async (req, res, next) => {
  try {
    // First check if prompt exists and belongs to user
    const prompt = await promptService.getPromptById(req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }
    
    // Check ownership for user-created prompts
    if (prompt.user_id && prompt.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this prompt' });
    }
    
    // Don't allow editing of built-in prompts
    if (!prompt.user_id) {
      return res.status(403).json({ message: 'Cannot modify built-in prompts' });
    }
    
    const updatedPrompt = await promptService.updatePrompt(req.params.id, req.body);
    res.json(updatedPrompt);
  } catch (err) {
    next(err);
  }
});

// Delete a prompt
router.delete('/:id', auth, async (req, res, next) => {
  try {
    // First check if prompt exists and belongs to user
    const prompt = await promptService.getPromptById(req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ message: 'Prompt not found' });
    }
    
    // Check ownership for user-created prompts
    if (prompt.user_id && prompt.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this prompt' });
    }
    
    // Don't allow deleting built-in prompts
    if (!prompt.user_id) {
      return res.status(403).json({ message: 'Cannot delete built-in prompts' });
    }
    
    const result = await promptService.deletePrompt(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
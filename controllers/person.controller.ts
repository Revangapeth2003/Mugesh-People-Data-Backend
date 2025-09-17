import { Request, Response } from 'express';
import PersonModel from '../models/person.model';

// FIXED: Helper function for unique validations
const validateUniqueFields = async (data: any, excludeId?: number) => {
  const errors: string[] = [];

  // Check Aadhar uniqueness
  if (data.aadharNumber || data.aadharnumber) {
    const aadharToCheck = data.aadharNumber || data.aadharnumber;
    const existing = await PersonModel.findByAadhar(aadharToCheck);
    if (existing && (!excludeId || existing.id !== excludeId)) {
      errors.push(`Aadhar number ${aadharToCheck} already exists for ${existing.name}`);
    }
  }
  
  // Check PAN uniqueness
  if (data.panNumber || data.pannumber) {
    const panToCheck = (data.panNumber || data.pannumber).toUpperCase();
    const existing = await PersonModel.findByPAN(panToCheck);
    if (existing && (!excludeId || existing.id !== excludeId)) {
      errors.push(`PAN number ${panToCheck} already exists for ${existing.name}`);
    }
  }

  // Check Voter ID uniqueness
  if (data.voterIdNumber || data.voteridnumber) {
    const voterIdToCheck = (data.voterIdNumber || data.voteridnumber).toUpperCase();
    const existing = await PersonModel.findByVoterID(voterIdToCheck);
    if (existing && (!excludeId || existing.id !== excludeId)) {
      errors.push(`Voter ID ${voterIdToCheck} already exists for ${existing.name}`);
    }
  }

  // Check Phone uniqueness
  if (data.phone) {
    const existing = await PersonModel.findByPhone(data.phone);
    if (existing && (!excludeId || existing.id !== excludeId)) {
      errors.push(`Phone number ${data.phone} already exists for ${existing.name}`);
    }
  }

  return errors;
};

// Get all people
export const getPeople = async (req: Request, res: Response) => {
  try {
    console.log('Getting people from database');

    const userRole = req.user?.role;
    const userDirection = req.user?.direction;
    let filter: any = {};

    // Filter by direction for admin users
    if (userRole === 'admin' && userDirection) {
      filter.direction = userDirection;
      console.log('Filtering for direction:', userDirection);
    }

    const people = await PersonModel.find(filter, { createdat: -1 });
    console.log(`Found ${people.length} people in database`);
    res.json({ 
      success: true, 
      data: people, 
      count: people.length, 
      message: `Retrieved ${people.length} people from database` 
    });
  } catch (error: unknown) {
    console.error('Error fetching people from database', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching people from database', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// FIXED: Add new person with proper validation and field mapping
export const addPerson = async (req: Request, res: Response) => {
  try {
    console.log('Adding person to database:', req.body.name);

    // Extract and validate required fields (frontend sends camelCase)
    const {
      name, age, phone, address, ward, street, direction, 
      aadharNumber, panNumber, voterIdNumber, gender, religion, caste, community, createdBy
    } = req.body;

    if (!name || !phone || !aadharNumber || !panNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: name, phone, aadharNumber, panNumber' 
      });
    }

    // UNIQUE FIELD VALIDATION before creating
    const validationErrors = await validateUniqueFields(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: validationErrors.join(', ')
      });
    }

    // CRITICAL FIX: Map camelCase to snake_case for database
    const personData = {
      name: name.trim(),
      age: parseInt(age),
      phone: phone.trim(),
      address: address.trim(),
      ward: ward.trim(),
      street: street.trim(),
      direction,
      // MAP camelCase to snake_case (matching your database schema)
      aadhar_number: aadharNumber.trim(),
      pan_number: panNumber.toUpperCase().trim(),
      voter_id_number: voterIdNumber ? voterIdNumber.toUpperCase().trim() : null,
      gender,
      religion: religion.trim(),
      caste: caste.trim(),
      community,
      created_by: createdBy || req.user?.email || 'api@example.com',
      is_active: true,
    };

    const savedPerson = await PersonModel.create(personData);
    console.log('✅ Person saved with id:', savedPerson.id);

    res.status(201).json({ 
      success: true, 
      data: savedPerson, 
      message: `Person ${name} added successfully to database` 
    });
  } catch (error: unknown) {
    console.error('❌ Error adding person to database', error);

    // Handle PostgreSQL constraint violations
    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
      if (error.message.includes('aadhar_number')) {
        return res.status(400).json({ success: false, message: 'Aadhar number already exists' });
      } else if (error.message.includes('pan_number')) {
        return res.status(400).json({ success: false, message: 'PAN number already exists' });
      } else if (error.message.includes('phone')) {
        return res.status(400).json({ success: false, message: 'Phone number already exists' });
      } else if (error.message.includes('voter_id_number')) {
        return res.status(400).json({ success: false, message: 'Voter ID already exists' });
      }
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error adding person to database', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// FIXED: Update person with validation
export const updatePerson = async (req: Request, res: Response) => {
  try {
    console.log('Updating person in database:', req.params.id);

    const personId = parseInt(req.params.id);
    if (isNaN(personId)) {
      return res.status(400).json({ success: false, message: 'Invalid person ID' });
    }

    // UNIQUE FIELD VALIDATION for updates (excluding current person)
    const validationErrors = await validateUniqueFields(req.body, personId);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: validationErrors.join(', ')
      });
    }

    // CRITICAL FIX: Map camelCase to snake_case
    const updateData: any = {};

    // Map all possible fields from camelCase to snake_case
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.age) updateData.age = parseInt(req.body.age);
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.address) updateData.address = req.body.address;
    if (req.body.ward) updateData.ward = req.body.ward;
    if (req.body.street) updateData.street = req.body.street;
    if (req.body.direction) updateData.direction = req.body.direction;
    if (req.body.gender) updateData.gender = req.body.gender;
    if (req.body.religion) updateData.religion = req.body.religion;
    if (req.body.caste) updateData.caste = req.body.caste;
    if (req.body.community) updateData.community = req.body.community;

    // Convert camelCase to snake_case for database fields
    if (req.body.aadharNumber) {
      updateData.aadhar_number = req.body.aadharNumber;
    }
    if (req.body.panNumber) {
      updateData.pan_number = req.body.panNumber.toUpperCase();
    }
    if (req.body.voterIdNumber) {
      updateData.voter_id_number = req.body.voterIdNumber.toUpperCase();
    }
    if (req.body.createdBy) {
      updateData.created_by = req.body.createdBy;
    }

    const person = await PersonModel.findByIdAndUpdate(personId, updateData, { new: true });

    if (!person) {
      return res.status(404).json({ success: false, message: 'Person not found in database' });
    }

    console.log('✅ Person updated:', person.id);
    res.json({ 
      success: true, 
      data: person, 
      message: `Person ${person.name} updated successfully in database` 
    });
  } catch (error: unknown) {
    console.error('❌ Error updating person in database', error);

    // Handle unique constraint violations for updates
    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
      if (error.message.includes('aadhar_number')) {
        return res.status(400).json({ success: false, message: 'Aadhar number already exists' });
      } else if (error.message.includes('pan_number')) {
        return res.status(400).json({ success: false, message: 'PAN number already exists' });
      } else if (error.message.includes('phone')) {
        return res.status(400).json({ success: false, message: 'Phone number already exists' });
      } else if (error.message.includes('voter_id_number')) {
        return res.status(400).json({ success: false, message: 'Voter ID already exists' });
      }
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error updating person in database', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Delete person
export const deletePerson = async (req: Request, res: Response) => {
  try {
    console.log('Deleting person from database:', req.params.id);

    const personId = parseInt(req.params.id);
    if (isNaN(personId)) {
      return res.status(400).json({ success: false, message: 'Invalid person ID' });
    }

    const person = await PersonModel.findByIdAndDelete(personId);

    if (!person) {
      return res.status(404).json({ success: false, message: 'Person not found in database' });
    }

    console.log('✅ Person deleted:', person.name);
    res.json({ 
      success: true, 
      message: `Person ${person.name} deleted successfully from database` 
    });
  } catch (error: unknown) {
    console.error('❌ Error deleting person from database', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting person from database', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// FIXED: Sync from Google Sheets to DB with proper field mapping
export const syncFromGoogleSheets = async (req: Request, res: Response) => {
  try {
    console.log('🔄 Syncing data from Google Sheets to Database');

    const peopleData = req.body;

    if (!peopleData || !Array.isArray(peopleData)) {
      return res.status(400).json({ success: false, message: 'Invalid people data provided' });
    }

    let syncedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const person of peopleData) {
      try {
        // Check if person already exists by Aadhar
        const existing = await PersonModel.findByAadhar(person.aadharNumber);
        if (existing) {
          skippedCount++;
          continue;
        }

        // CRITICAL FIX: Map camelCase to snake_case for database insertion
        const dbPersonData = {
          name: person.name,
          age: parseInt(person.age),
          phone: person.phone,
          address: person.address,
          ward: person.ward,
          street: person.street,
          direction: person.direction,
          aadhar_number: person.aadharNumber, // camelCase → snake_case
          pan_number: person.panNumber?.toUpperCase(),
          voter_id_number: person.voterIdNumber?.toUpperCase(),
          gender: person.gender,
          religion: person.religion,
          caste: person.caste,
          community: person.community,
          created_by: person.createdBy || 'sync@googlesheets.com',
          is_active: true,
        };

        await PersonModel.create(dbPersonData);
        syncedCount++;
        console.log(`✅ Synced: ${person.name}`);
      } catch (error: any) {
        const errorMsg = `Failed to sync ${person.name}: ${error.message || 'Unknown error'}`;
        errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    console.log(`🔄 Sync completed: ${syncedCount} synced, ${skippedCount} skipped, ${errors.length} errors`);

    res.json({
      success: true,
      message: `Sync completed: ${syncedCount} people synced to database`,
      stats: { synced: syncedCount, skipped: skippedCount, errors: errors.length },
      errors: errors.length === 0 ? undefined : errors,
    });

  } catch (error: unknown) {
    console.error('❌ Sync error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error syncing data from Google Sheets', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

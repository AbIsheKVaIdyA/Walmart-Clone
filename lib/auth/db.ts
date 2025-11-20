/**
 * Secure Database Functions
 * 
 * All database queries use Supabase's query builder which automatically
 * parameterizes queries to prevent SQL injection attacks.
 * 
 * IMPORTANT: Never use string concatenation or template literals for SQL queries!
 * Always use Supabase's query builder methods (.eq(), .insert(), etc.)
 */

import { User, UserRole, UserWithoutPassword } from "@/typings/authTypings";
import { hashPassword } from "./password";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Find user by email
 * 
 * ✅ SECURE: Uses Supabase's parameterized query (.eq())
 * This prevents SQL injection attacks even if email contains malicious SQL code
 * 
 * @param email - User's email address
 * @returns User object or null if not found
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  // Validate input
  if (!email || typeof email !== 'string') {
    return null;
  }

  // Normalize email (lowercase, trim)
  const normalizedEmail = email.toLowerCase().trim();
  
  console.log('🔍 DB DEBUG: Searching for user with email:');
  console.log('  Original email:', email);
  console.log('  Normalized email:', normalizedEmail);

  // Use admin client to bypass RLS for user lookup
  // This is safe because we're doing server-side lookups with proper validation
  const supabase = createAdminClient();

  // ✅ SECURE: Supabase automatically parameterizes this query
  // The .eq() method uses prepared statements internally
  // Even if email contains SQL code like "admin@test.com' OR '1'='1",
  // it will be treated as a literal string value
  // Using .maybeSingle() instead of .single() to handle "not found" gracefully
  // Explicitly select password field to ensure it's included
  
  // First, let's try exact match
  let { data, error } = await supabase
    .from('users')
    .select('id, email, name, password, role, created_at, updated_at')
    .eq('email', normalizedEmail) // ✅ Parameterized automatically!
    .maybeSingle(); // Returns null if no rows found, instead of throwing error

  // If not found, try case-insensitive search (in case email wasn't normalized during signup)
  if (!data && !error) {
    console.log('🟡 DB DEBUG: Exact match not found, trying case-insensitive search...');
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('id, email, name, password, role, created_at, updated_at')
      .ilike('email', normalizedEmail); // Case-insensitive LIKE
    
    if (allUsers && allUsers.length > 0) {
      console.log('🟢 DB DEBUG: Found user with case-insensitive search!');
      console.log('🟢 DB DEBUG: Stored email in DB:', allUsers[0].email);
      console.log('🟢 DB DEBUG: Searching for:', normalizedEmail);
      console.log('🟢 DB DEBUG: Emails match?', allUsers[0].email.toLowerCase().trim() === normalizedEmail);
      data = allUsers[0];
    } else if (allError) {
      error = allError;
    }
  }

  if (error) {
    // Log error but don't expose details to client
    console.error('🔴 DB DEBUG: Error finding user by email:', error.message);
    return null;
  }

  if (!data) {
    console.log('🔴 DB DEBUG: No user found with email:', normalizedEmail);
    // Let's also check what emails actually exist (for debugging)
    const { data: sampleUsers } = await supabase
      .from('users')
      .select('email')
      .limit(5);
    console.log('🔍 DB DEBUG: Sample emails in database:', sampleUsers?.map(u => u.email));
    return null;
  }
  
  console.log('🟢 DB DEBUG: User found! Stored email:', data.email);

  // Map database snake_case to TypeScript camelCase
  const mappedUser = {
    id: data.id,
    email: data.email,
    name: data.name,
    password: data.password, // This is the hashed password from database
    role: data.role as UserRole,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
  
  console.log('🟡 DB DEBUG: Mapped user password field:', {
    hasPassword: !!mappedUser.password,
    passwordType: typeof mappedUser.password,
    passwordLength: mappedUser.password?.length || 0,
    passwordPreview: mappedUser.password?.substring(0, 20) || 'N/A',
  });
  
  return mappedUser as User;
}

/**
 * Find user by ID
 * 
 * ✅ SECURE: Uses Supabase's parameterized query (.eq())
 * 
 * @param id - User's UUID
 * @returns User object or null if not found
 */
export async function findUserById(id: string): Promise<User | null> {
  // Validate input
  if (!id || typeof id !== 'string') {
    return null;
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error('Invalid UUID format:', id);
    return null;
  }

  // Use admin client to bypass RLS for user lookup
  const supabase = createAdminClient();

  // ✅ SECURE: Parameterized query
  // Using .maybeSingle() to handle "not found" gracefully
  // Explicitly select password field to ensure it's included
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, password, role, created_at, updated_at')
    .eq('id', id) // ✅ Parameterized automatically!
    .maybeSingle(); // Returns null if no rows found, instead of throwing error

  if (error) {
    console.error('Error finding user by ID:', error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  // Map database snake_case to TypeScript camelCase
  const mappedUser = {
    id: data.id,
    email: data.email,
    name: data.name,
    password: data.password, // This is the hashed password from database
    role: data.role as UserRole,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
  
  console.log('🟡 DB DEBUG: Mapped user password field:', {
    hasPassword: !!mappedUser.password,
    passwordType: typeof mappedUser.password,
    passwordLength: mappedUser.password?.length || 0,
    passwordPreview: mappedUser.password?.substring(0, 20) || 'N/A',
  });
  
  return mappedUser as User;
}

/**
 * Create a new user
 * 
 * ✅ SECURE: Uses Supabase's parameterized query (.insert())
 * Password is hashed before storage (never store plain text passwords!)
 * 
 * @param email - User's email address
 * @param name - User's name
 * @param password - Plain text password (will be hashed)
 * @param role - User role (default: CUSTOMER)
 * @returns User object without password
 * @throws Error if user already exists or creation fails
 */
export async function createUser(
  email: string,
  name: string,
  password: string,
  role: UserRole = UserRole.CUSTOMER
): Promise<UserWithoutPassword> {
  // Validate input
  if (!email || !name || !password) {
    throw new Error('Email, name, and password are required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Validate password length
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  // Check if user already exists
  // ✅ SECURE: Parameterized query
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password before storing (NEVER store plain text passwords!)
  const hashedPassword = await hashPassword(password);
  
  console.log('🟢 SIGNUP DEBUG: Password hashed successfully');
  console.log('🟢 SIGNUP DEBUG: Hash length:', hashedPassword.length);
  console.log('🟢 SIGNUP DEBUG: Hash starts with:', hashedPassword.substring(0, 20));

  // Use admin client for user creation to bypass RLS
  // This is safe because we're creating users server-side with proper validation
  // In production, you might want to use Supabase Auth instead
  const supabase = createAdminClient();

  // ✅ SECURE: Supabase automatically parameterizes the insert query
  // All values are passed as parameters, preventing SQL injection
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: normalizedEmail, // ✅ Parameterized
      name: name.trim(), // ✅ Parameterized
      password: hashedPassword, // ✅ Parameterized (already hashed)
      role: role, // ✅ Parameterized
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, email, name, role, created_at, updated_at') // Only select non-sensitive fields
    .single();
  
  console.log('🟢 SIGNUP DEBUG: User insert result:', {
    success: !error,
    userId: data?.id,
    error: error?.message,
  });

  if (error) {
    // Handle duplicate email error
    if (error.code === '23505' || error.message?.includes('duplicate')) {
      throw new Error('User with this email already exists');
    }
    
    console.error('Error creating user:', error.message);
    throw new Error('Failed to create user');
  }

  if (!data) {
    throw new Error('Failed to create user');
  }

  // Return user without password
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role as UserRole,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update user information
 * 
 * ✅ SECURE: Uses parameterized query (.update() with .eq())
 * 
 * @param userId - User's UUID
 * @param updates - Fields to update
 * @returns Updated user without password
 */
export async function updateUser(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'email' | 'role'>>
): Promise<UserWithoutPassword> {
  // Validate input
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }

  // Build update object (only include provided fields)
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) {
    updateData.name = updates.name.trim();
  }

  if (updates.email !== undefined) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updates.email)) {
      throw new Error('Invalid email format');
    }
    updateData.email = updates.email.toLowerCase().trim();
  }

  if (updates.role !== undefined) {
    updateData.role = updates.role;
  }

  // Use admin client for updates to bypass RLS
  // In production, ensure proper authorization checks before calling this
  const supabase = createAdminClient();

  // ✅ SECURE: Parameterized query
  const { data, error } = await supabase
    .from('users')
    .update(updateData) // ✅ All values are parameterized
    .eq('id', userId) // ✅ Parameterized
    .select('id, email, name, role, created_at, updated_at')
    .maybeSingle(); // Use maybeSingle for consistency

  if (error) {
    console.error('Error updating user:', error.message);
    throw new Error('Failed to update user');
  }

  if (!data) {
    throw new Error('User not found');
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role as UserRole,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}


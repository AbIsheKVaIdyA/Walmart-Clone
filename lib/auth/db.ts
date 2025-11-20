/**
 * Secure Database Functions
 * Uses Supabase's parameterized queries to prevent SQL injection.
 */

import { User, UserRole, UserWithoutPassword } from "@/typings/authTypings";
import { hashPassword } from "./password";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function findUserByEmail(email: string): Promise<User | null> {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const supabase = createAdminClient();

  let { data, error } = await supabase
    .from('users')
    .select('id, email, name, password, role, created_at, updated_at')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (!data && !error) {
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('id, email, name, password, role, created_at, updated_at')
      .ilike('email', normalizedEmail);
    
    if (allUsers && allUsers.length > 0) {
      data = allUsers[0];
    } else if (allError) {
      error = allError;
    }
  }

  if (error) {
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    password: data.password,
    role: data.role as UserRole,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as User;
}

export async function findUserById(id: string): Promise<User | null> {
  if (!id || typeof id !== 'string') {
    return null;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return null;
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, password, role, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    password: data.password,
    role: data.role as UserRole,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as User;
}

export async function createUser(
  email: string,
  name: string,
  password: string,
  role: UserRole = UserRole.CUSTOMER
): Promise<UserWithoutPassword> {
  if (!email || !name || !password) {
    throw new Error('Email, name, and password are required');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await hashPassword(password);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: normalizedEmail,
      name: name.trim(),
      password: hashedPassword,
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, email, name, role, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === '23505' || error.message?.includes('duplicate')) {
      throw new Error('User with this email already exists');
    }
    throw new Error('Failed to create user');
  }

  if (!data) {
    throw new Error('Failed to create user');
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

export async function updateUser(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'email' | 'role'>>
): Promise<UserWithoutPassword> {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID');
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) {
    updateData.name = updates.name.trim();
  }

  if (updates.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updates.email)) {
      throw new Error('Invalid email format');
    }
    updateData.email = updates.email.toLowerCase().trim();
  }

  if (updates.role !== undefined) {
    updateData.role = updates.role;
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, email, name, role, created_at, updated_at')
    .maybeSingle();

  if (error) {
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

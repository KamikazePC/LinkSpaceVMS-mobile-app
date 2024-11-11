import { AuthResponse, OAuthProvider, User } from "../types";
import { supabase } from "./supabase";

const validateAddressFormat = (address: string): boolean => {
    // Example regex to match "Number Street Name"
    const addressPattern = /^[0-9]+\s[A-Za-z\s]+$/;
    return addressPattern.test(address);
};


export const createUser = async (
    email: string, 
    password: string, 
    username: string,  
    registration_code: string,
    address?: string, 
    phone_number?: string
): Promise<User> => {
    try {

        // // Validate the address format (Number and Street Name)
        // if (!validateAddressFormat(address!)) {
        //     throw new Error('Please enter the address in the format: "Number Street Name"');
        // }

        // Fetch the estate_id based on the registration_code
        const { data: estateData, error: estateError } = await supabase
          .from('estates')
          .select('id')
          .eq('registration_code', registration_code)
          .single();

        if (estateError) throw new Error('Invalid registration code');

        const estate_id = estateData.id; // Get estate_id from the response
        
        // Check if the address is already in use by another user in the same estate
        const { data: existingAddress, error: addressError } = await supabase
          .from('residents')
          .select('id')
          .eq('address', address)
          .eq('estate_id', estate_id)  // Ensure the check is estate-specific
          .single();

        if (existingAddress) {
            throw new Error('This address is already associated with another user in the same estate.');
        }

        if (addressError && addressError.code !== 'PGRST116') {
            throw addressError;
        }

        //Sign up the user with supabase auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email, 
            password,
        })

        if (signUpError) throw signUpError;

        if (!authData?.user) {
            throw new Error('User creation failed');
        }

        const userId = authData.user.id.toString();

        const { data, error: insertError } = await supabase
          .from('residents')
          .insert([
            {
                id: userId, 
                email,
                username, 
                estate_id: estate_id,
                address, 
                phone_number: phone_number
            }
          ])
          .single();

          if (insertError) throw insertError;

           // Fetch the user data to ensure the new resident data is available before sign-in
        const { data: fetchedUser, error: fetchUserError } = await supabase
          .from('residents')
          .select('*')
          .eq('id', userId)
          .single();

        if (fetchUserError) throw fetchUserError;

          console.log('User created successfully:', fetchedUser);

          // Automatically sign in the user after registration
          await signIn(email, password);

          return fetchedUser as User
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};


export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        console.log('Starting sign-in process for email:', email);
        const {data: { user }, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) throw error;
        // console.log('Session created successfully:', user);

        const { data, error: fetchError} = await supabase
         .from('residents')
         .select('*')
         .eq('id', user?.id)
         .single();

         if(fetchError) throw fetchError;
         console.log('Current user retrieved:', data);

         if (!data) {
            throw new Error('Failed to retrieve user document');
          }
      
          // Import getCurrentDeviceId and addDevice here to avoid circular dependency
          const { getCurrentDeviceId, addDevice, performPeriodicCheck } = await import('./device-manager');


         const deviceId = await getCurrentDeviceId();
         console.log('Current device ID:', deviceId);

         try {
            await addDevice(data.id, deviceId);
            // console.log('Device associated with user');
          } catch (addDeviceError) {
            // console.error('Error associating device with user:', addDeviceError);
          }

          // Fetch the updated session to confirm changes
          const { data: session, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          console.log('Updated session:', session);

          console.log('Performing periodic check...');
          await performPeriodicCheck();
          console.log('Periodic check completed');

         return { user: data as User, session: session.session };
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
};

export const signInAsSecurity  = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        console.log('Starting sign-in process for email:', email);
        const {data: { user }, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) throw error;
        console.log('Session created successfully:', user);

        const { data, error: fetchError} = await supabase
         .from('security')
         .select('*')
         .eq('email', user?.email)
         .single();

         if(fetchError) throw fetchError;
         console.log('Current user retrieved:', data);

         if (!data) {
            throw new Error('Failed to retrieve user document');
          }
      
        //   // Import getCurrentDeviceId and addDevice here to avoid circular dependency
        //   const { getCurrentDeviceId, addDevice, performPeriodicCheck } = await import('./device-manager');


        //  const deviceId = await getCurrentDeviceId();
        //  console.log('Current device ID:', deviceId);

        //  try {
        //     await addDevice(data.id, deviceId);
        //     console.log('Device associated with user');
        //   } catch (addDeviceError) {
        //     console.error('Error associating device with user:', addDeviceError);
        //   }

          // Fetch the updated session to confirm changes
          const { data: session, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          console.log('Updated session:', session);

        //   console.log('Performing periodic check...');
        //   await performPeriodicCheck();
        //   console.log('Periodic check completed');

         return { user: data as User, session: session.session };
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
};


export const getCurrentUser = async (): Promise<{ user: User, userType: 'resident' | 'security' }> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('No user found');

        // Check 'residents' table
        const { data: residentData } = await supabase
            .from('residents')
            .select('*')
            .eq('id', user.id)
            .single();

        if (residentData) {
            return { user: residentData as User, userType: 'resident' };
        }

        // Check 'security' table
        const { data: securityData } = await supabase
            .from('security')
            .select('*')
            .eq('email',  user?.email)
            .single();

        if (securityData) {
            return { user: securityData as User, userType: 'security' };
        }

        throw new Error('User not found in residents or security');
    } catch (error) {
        console.error('Error getting current user:', error);
        throw error;
    }
};



export const signInWithProvider = async (provider: OAuthProvider): Promise<AuthResponse> => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider
        });

        if (error) throw error;

        return data as unknown as AuthResponse;
    } catch (error) {
        console.error('Error signing in with provider:', error);    
        throw error;
    }
}

export const signInWithMagicLink = async (email: string): Promise<void> => {
    try{
        const {error} = await supabase.auth.signInWithOtp({
            email: email
        });

        if(error) throw error;
    } catch (error) {
        console.error('Error sending magic link:', error);
        throw error;
    }
}

export const verifyOTP = async (email: string, token: string): Promise<AuthResponse> => {
    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'magiclink'
        });

        if (error) throw error;

        return data as unknown as AuthResponse;
    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw error;
    }
}

export const updateUserAfterAuth = async (userId: string, userData: Partial<User>): Promise<User> => {
    try {
        const {data, error} = await supabase
        .from('residents')
        .update({
            id: userId,
            email: userData.email,
            username: userData.username || userData.email?.split('@')[0],
            address: userData.address,
            phone_number: userData.phone_number,

        })
        .eq('id', userId)
        .single();

        if (error) throw error;

        return data as User
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
      // Get current session (or user session) to check if the user is logged in
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
      if (sessionError) {
        throw sessionError;
      }
  
      if (!sessionData.session) {
        console.log('No current user session found.');
        return { success: true, message: 'No active session to log out from' };
      }
  
      const currentUser = sessionData.session.user;
  
      const { getCurrentDeviceId, unifiedDeviceRemoval } = await import('./device-manager');
      const deviceId = await getCurrentDeviceId();
  
      try {
        // Remove the device associated with the current user (if applicable)
        await unifiedDeviceRemoval(currentUser.id, deviceId, false);
        console.log('Device removed successfully');
      } catch (removeDeviceError) {
        console.error('Error removing device:', removeDeviceError);
        // Continue with logout even if device removal fails
      }
  
      // Log the user out via Supabase's signOut method
      const { error: signOutError } = await supabase.auth.signOut();
  
      if (signOutError) {
        throw signOutError;
      }
  
      console.log('Logged out successfully');
      return { success: true, message: 'Logged out successfully' };
  
    } catch (error: any) {
      console.error('Error logging out:', error.message || error);
      return { success: false, message: 'Error logging out: ' + (error.message || error) };
    }
  };
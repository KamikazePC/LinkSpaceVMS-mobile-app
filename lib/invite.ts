import {supabase} from './supabase'
import {v4 as uuidv4} from 'uuid';
import moment from 'moment-timezone';
import { createInviteNotification } from './notifications';

//Helper function to generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}



//Create invite
export const createInvite = async (
    resident_name: string,
    visitor_name: string,
    visitor_phone: string,
    address: string,
    estate: string,
    userId: string,
    start_date_time: moment.Moment,
    end_date_time: moment.Moment,
    is_recurring: boolean
) => {
    try {
        const otp = generateOTP();
        const id = uuidv4();  

        const inviteData = {
            id: id,
            resident_name: resident_name,
            visitor_name: visitor_name,
            visitor_phone: visitor_phone,
            address: address,
            estate_id: estate,
            created_by: userId,
            otp,
            status: 'pending',
            start_date_time: start_date_time,
            end_date_time: end_date_time,
            is_recurring: is_recurring,
            entry_time: null,
            exit_time: null,
        }

        const {data, error} = await supabase
         .from(is_recurring ? 'individual_recurring_invites' : 'individual_one_time_invites')
         .insert(inviteData)
         .select()
         .single();

        if(error) throw error;
        console.log('Inserted data:', data);  // Add this log
        return data;
    } catch (error) {
        console.error('Error creating invite:', error);
        throw error;
    }
}

//create group invite
export const createGroupInvite = async (
    resident_name: string,
    address: string,
    estate: string,
    userId: string,
    date: string,
    startTime: string,
    endTime: string,
    groupName: string
) => {
    try {
        const otp = generateOTP();
        const id = uuidv4();

        const start_date_time = moment(date + ' ' + startTime, 'YYYY-MM-DD HH:mm');
        const end_date_time = moment(date + ' ' + endTime, 'YYYY-MM-DD HH:mm');

        const groupInviteData = {
            id: id,
            resident_name: resident_name,
            address: address,
            estate_id: estate,
            created_by: userId,
            otp,
            status: 'pending',
            start_date_time: start_date_time,
            end_date_time: end_date_time,
            group_name: groupName,
            members_checked_in: 0,
        };

        const {data, error} = await supabase 
         .from('group_invites')
         .insert(groupInviteData)
         .select()
         .single();

        if(error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating group invite:', error);
        throw error;
    }
}

//Get all invites
export const fetchInvites = async (address: string, userId: string) => {
    try {
        const [oneTimeInvites, recurringInvites, groupInvites] = await Promise.all([
            supabase
            .from('individual_one_time_invites')
            .select('*')
            .eq('created_by', userId)
            .eq('address', address),
            supabase
            .from('individual_recurring_invites')
            .select('*')
            .eq('created_by', userId)
            .eq('address', address),
            supabase
            .from('group_invites')
            .select('*')
            .eq('created_by', userId)
            .eq('address', address)
        ])

        return [
            ...oneTimeInvites.data || [],
            ...recurringInvites.data || [],
            ...groupInvites.data || []
        ]
    } catch (error) {
        console.error('Error fetching invites:', error);
        throw error;
    }
}

export const fetchAllInvites = async () => {
    try {
      const [oneTimeInvitesResponse, recurringInvitesResponse, groupInvitesResponse] = await Promise.all([
        supabase
          .from('individual_one_time_invites')
          .select('*'),
        supabase
          .from('individual_recurring_invites')
          .select('*'),
        supabase
          .from('group_invites')
          .select('*')
      ]);
  
      // Check for errors in each response
      if (oneTimeInvitesResponse.error || recurringInvitesResponse.error || groupInvitesResponse.error) {
        throw new Error('Error fetching invites');
      }
  
          // Combine all invites into one array
    const allInvites = [
        ...oneTimeInvitesResponse.data,
        ...recurringInvitesResponse.data,
        ...groupInvitesResponse.data
      ];
  
  
      // Sort all invites by creation date, most recent first
      allInvites.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return allInvites;
    } catch (error: any) {
      console.error('Error fetching invites:', error);
      throw new Error('Could not fetch invites: ' + error.message);
    }
  };

//handle invite scan
export const handleInviteScan = async (
    scannedData: string | { id: string, otp: string }, 
    actionType: 'fetch' | 'checkin' | 'checkout'
) => {
    try {
        let id, otp;

        // Handle scanned data
        if (typeof scannedData === 'string') {
            try {
                const url = new URL(scannedData);
                if (url.protocol === 'gatekeeper:') {
                    id = url.searchParams.get('id');
                    otp = url.searchParams.get('otp');

                    console.log('ID:', id);
                    console.log('OTP:', otp);
                } else {
                    otp = scannedData;
                }
            } catch (error) {
                otp = scannedData;
            }
        } else {
            id = scannedData.id;
            otp = scannedData.otp;
        }

        // Fetch invite by ID or OTP
        let invite;
        if (id) {
            invite = await fetchInviteById(id);
        } else if (otp !== null) {
            invite = await fetchInviteByOtp(otp);
        } else {
            throw new Error('OTP is null');
        }

        // Action type: 'fetch'
        if (actionType === 'fetch') {
            return invite;
        }

        if (!invite) {
            throw new Error('Invalid or expired invite');
        }

        if (id && otp && invite.otp !== otp) {
            throw new Error('Invalid OTP');
        }

        const timezone = 'Africa/Lagos'; // Replace with your timezone, e.g., 'America/New_York', 'Europe/London', etc.
        const now = moment.tz(timezone); 
        console.log('Current time:', now.format());

        const inviteTime = moment.tz(invite.start_date_time, timezone); // Convert to local time
        const inviteEndTime = moment.tz(invite.end_date_time, timezone); // Convert to local time


        console.log('Invite time:', inviteTime.format());
        console.log('Invite end time:', inviteEndTime.format());

        if ((now.isBefore(inviteTime) || now.isAfter(inviteEndTime)) && invite.status === 'pending') {
            throw new Error('This invite is not valid at the moment');
        }

        // Variables for updating invite status
        let updatedStatus = invite.status;
        let entry_time = invite.entry_time;
        let exit_time = invite.exit_time;
        let members_checked_in = invite.members_checked_in;

        if (actionType === 'checkin') {
            const currentTime = moment(); // Get current time
        
            // Allow check-in for recurring invites as long as end_date_time hasn't passed
            if (invite.is_recurring && now.isBefore(inviteEndTime)) {
                if (invite.status === 'pending' || invite.status === 'checked-out') {
                    updatedStatus = 'checked-in';
                    entry_time = now.format('YYYY-MM-DD HH:mm:ss');
                } else if (invite.status === 'active') {
                    // Continue checking in members for a group invite
                    members_checked_in += 1;
                } else {
                    console.log('This invite cannot be used for check-in.');
                    throw new Error('This invite cannot be used for check-in.');
                }
            } else if (!invite.is_recurring) { // Handle non-recurring invites
                if (invite.status === 'pending') {
                    updatedStatus = 'checked-in';
                    entry_time = now.format('YYYY-MM-DD HH:mm:ss');
        
                    // Check for group invite based on members_checked_in
                    if (invite.group_name) {
                        updatedStatus = 'active';
                        members_checked_in += 1;
                    }
                } else if (invite.status === 'active') {
                    members_checked_in += 1;
                } else {
                    console.log('This invite cannot be used for check-in.');
                    throw new Error('This invite cannot be used for check-in.');
                }
            } else {
                console.log('This invite cannot be used for check-in.');
                throw new Error('This invite cannot be used for check-in.');
            }
        }
        
        // Handle check-out
        else if (actionType === 'checkout') {
            if (invite.status === 'checked-in') {
                if (invite.group_name) { // This handles both 0 and > 0 cases
                    members_checked_in -= 1;
                    updatedStatus = members_checked_in > 0 ? 'active' : 'pending';
                } else {
                    updatedStatus = 'checked-out';
                }
                exit_time = now.format('YYYY-MM-DD HH:mm:ss');
            } else {
                console.log('This invite cannot be used for check-out.');
                throw new Error('This invite cannot be used for check-out.');
            }
        }
        

        // Update the invite status in the database
        await updateInviteStatus(invite, updatedStatus, entry_time, exit_time, members_checked_in);

        // Send notifications for individual and group invites
        if (!invite.group_name) {
            // Individual invite logic
            const notificationTitle = actionType === 'checkin' ? 'Visitor Checked In' : 'Visitor Checked Out';
            const notificationMessage = `${invite.visitor_name || invite.group_name} has ${actionType === 'checkin' ? 'checked in' : 'checked out'}.`;
            await createInviteNotification(notificationTitle, notificationMessage, invite.created_by);
        } else {
            // Group invite logic
            const notificationTitle = actionType === 'checkin' ? 'Group Member Checked In' : 'Group Member Checked Out';
            const notificationMessage = `${invite.group_name} has ${actionType === 'checkin' ? 'a member checked in' : 'a member checked out'}. Total members checked in: ${members_checked_in}.`;
            await createInviteNotification(notificationTitle, notificationMessage, invite.created_by);
        }
        

        // Return updated invite data
        return {
            ...invite,
            status: updatedStatus,
            entry_time,
            exit_time,
            members_checked_in
        };
    } catch (error) {
        console.error('Error handling invite scan:', error);
        throw error;
    }
};


const fetchInviteById = async (id: string) => {
    try {
        const tables = ['group_invites', 'individual_one_time_invites', 'individual_recurring_invites'];

        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('id', id)
                .single(); // This expects a single row

            if (error) {
                // Log error for each table to see what went wrong
                console.error(`Error fetching from ${table}:`, error.message);
                continue; // Continue to the next table if there's an error
            }

            // If data is found, return it
            if (data) {
                return data;
            }
        }

        // If no invite was found in any table, throw an error
        throw new Error('Invite not found in any table');
    } catch (error) {
        console.error('Error fetching invite by ID:', error);
        throw error;
    }
};


const fetchInviteByOtp = async (otp: string) => {
    try {
        const tables = [
            'group_invites',
            'individual_one_time_invites',
            'individual_recurring_invites',
        ];
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('otp', otp)
                .single();

            if (error && error.code !== 'PGRST116') { // Exclude not found error
                console.error(`Error fetching from ${table}:`, error);
                throw error; // Handle other errors
            }

            if (data) {
                return data; // Found invite
            }
        }

        // If no invite was found in any table, return null or throw an error
        console.warn(`No invite found for OTP: ${otp}`);
        return null; // or throw new Error('No invite found for this OTP');
    } catch (error) {
        console.error('Error fetching invite by OTP:', error);
        throw error; // Propagate error
    }
};


const updateInviteStatus = async (
    invite: any,
    status: string,
    entry_time: string | null,
    exit_time: string | null,
    members_checked_in: number | null
) => {
    try {
        // Check if the invite has members_checked_in, assuming this indicates a group invite
        if (invite.group_name) {
            // Updating group invite
            const { error } = await supabase
                .from('group_invites')
                .update({ status, entry_time, exit_time, members_checked_in })
                .eq('id', invite.id);
            if (error) throw error;
        } else if (invite.is_recurring) {
            // Updating recurring individual invite
            const { error } = await supabase
                .from('individual_recurring_invites')
                .update({ status, entry_time, exit_time })
                .eq('id', invite.id);
            if (error) throw error;
        } else {
            // Updating one-time individual invite
            const { error } = await supabase
                .from('individual_one_time_invites')
                .update({ status, entry_time, exit_time })
                .eq('id', invite.id);
            if (error) throw error;
        }

        console.log('Invite status updated successfully');
    } catch (error) {
        console.error('Error updating invite status:', error);
        throw error;
    }
};

export const deleteInvite = async (id: string, invite: any) => {
    try {
        if (!invite) {
            throw new Error('Invite object is undefined');
        }

        console.log('Starting deletion process for invite:', id);
        console.log('Invite details:', invite);

        let tableName = '';
        if (invite.group_name) {
            tableName = 'group_invites';
        } else if (invite.is_recurring) {
            tableName = 'individual_recurring_invites';
        } else {
            tableName = 'individual_one_time_invites';
        }

        console.log(`Attempting to delete from table: ${tableName}`);

        // Check if the invite exists
        const { data: existingInvite, error: checkError } = await supabase
            .from(tableName)
            .select('id')
            .eq('id', id);

        if (checkError) {
            console.error('Error checking invite existence:', checkError);
            throw checkError;
        }

        if (!existingInvite) {
            console.log(`Invite with ID ${id} not found in ${tableName}`);
            return null;
        }

        // Perform the deletion
        const { data, error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error during deletion:', error);
            throw error;
        }

        console.log('Deletion result:', data);

        if (data ) {
            console.log(`Invite with ID ${id} deleted successfully from ${tableName}.`);
            return data[0];
        } else {
            console.log(`No invite was deleted for ID ${id} from ${tableName}. This might indicate an issue.`);
            return null;
        }

    } catch (error: any) {
        console.error('Error deleting invite:', error.message || error);
        console.error('Error details:', error);
        throw error;
    }
};



export const deleteExpiredInvites = async () => {
    try {

        const timezone = 'Africa/Lagos'; // Replace with your timezone, e.g., 'America/New_York', 'Europe/London', etc.
        const currentDate = moment.tz(timezone); 


      console.log('Starting deletion process for expired invites');
      console.log('Current date:', currentDate);
  
      // Fetch expired invites from the individual one-time invites collection
      const { data: oneTimeExpiredInvites, error: oneTimeError } = await supabase
        .from('individual_one_time_invites')
        .select('*')  // Select all invites for deletion
        .eq('status', 'pending')
        .lt('end_date_time', currentDate);
  
      if (oneTimeError) {
        throw new Error(`Error fetching one-time expired invites: ${oneTimeError.message}`);
      }
  
      // Fetch expired invites from the individual recurring invites collection
      const { data: recurringExpiredInvites, error: recurringError } = await supabase
        .from('individual_recurring_invites')
        .select('*')
        .eq('status', 'pending')
        .lt('end_date_time', currentDate);
  
      if (recurringError) {
        throw new Error(`Error fetching recurring expired invites: ${recurringError.message}`);
      }
  
      // Fetch expired invites from the group invites collection
      const { data: groupExpiredInvites, error: groupError } = await supabase
        .from('group_invites')
        .select('*')
        .eq('status', 'pending')
        .lt('end_date_time', currentDate);
  
      if (groupError) {
        throw new Error(`Error fetching group expired invites: ${groupError.message}`);
      }
  
      // Combine invite IDs from all collections for deletion
      const allExpiredInviteIds = [
        ...(oneTimeExpiredInvites ?? []).map((invite) => invite.id),
        ...(recurringExpiredInvites ?? []).map((invite) => invite.id),
        ...(groupExpiredInvites ?? []).map((invite) => invite.id),
      ];
  
      // Create deletion promises for each expired invite
      const deletePromises = [
        supabase.from('individual_one_time_invites').delete().in('id', allExpiredInviteIds),
        supabase.from('individual_recurring_invites').delete().in('id', allExpiredInviteIds),
        supabase.from('group_invites').delete().in('id', allExpiredInviteIds),
      ];
  
      // Wait for all deletions to complete
      await Promise.all(deletePromises);
  
      console.log(`Deleted expired invites: ${allExpiredInviteIds.length}`);
    } catch (error: any) {
      console.error('Error deleting expired invites:', error.message || error);
      throw new Error('Error deleting expired invites: ' + error.message);
    }
  };
  


  export const scheduleExpiredInviteCleanup = (intervalMinutes: number) => {
    setInterval(async () => {
      try {
        // Call the deleteExpiredInvites function directly to clean up all expired invites
        await deleteExpiredInvites();
  
        console.log('Completed scheduled cleanup of expired invites');
      } catch (error) {
        console.error('Error in scheduled expired invite cleanup:', error);
      }
    }, intervalMinutes * 60 * 1000);  // Interval in milliseconds
  };
  
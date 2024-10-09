import {supabase} from './supabase'
import {v4 as uuidv4} from 'uuid';
import moment from 'moment';

//Create invite notification
export const createInviteNotification = async (title: string, message: string, userId: string) => {
    try {
        const notificationId = uuidv4();
        const {data, error} = await supabase
         .from('notifications')
         .insert({
             id : notificationId.toString(),
             title: title, 
             message: message, 
             user_id: userId,
             read: false
         })

         if(error) throw error;

         return data
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

export const fetchNotifications = async (user_id: string) => {
    try {
        const {data, error} = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(10);

        if(error) throw error;
        return data
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
}

export const markNotificationAsRead = async (id: string) => {
    try {
        const {data, error} = await supabase
        .from('notifications')
        .update({read: true})
        .eq('id', id);

        if(error) throw error;
        return data
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
}

export const deleteNotification = async (id: string) => {
    try {
        
        const {data, error} = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

        if(error) throw error;
        return data
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};

export const deleteAllNotifications = async (user_id: string) => {
    try {
        console.log('Deleting notifications for user ID:', user_id);  // Log user ID being used

        const { data, error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', user_id);

        // Log the result of the deletion attempt
        console.log('Deletion Result:', data);  // Log the returned data
        if (error) {
            console.error('Error during deletion:', error);  // Log any errors
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error deleting all notifications:', error);
        throw error;
    }
};

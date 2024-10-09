// import React, { createContext, useState, useEffect, useContext } from 'react';
// import { fetchNotifications, getCurrentUserId } from '../lib/appwrite';

// export const NotificationContext = createContext();
// export const useNotificationContext = () => useContext(NotificationContext);
// export const NotificationProvider = ({ children }) => {
//   const [notifications, setNotifications] = useState([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       const userId = await getCurrentUserId();
//       const userNotifications = await fetchNotifications(userId);
//       setNotifications(userNotifications);
//     };

//     fetchData();
//   }, []);

//   return (
//     <NotificationContext.Provider value={{ notifications, setNotifications }}>
//       {children}
//     </NotificationContext.Provider>
//   );
// };

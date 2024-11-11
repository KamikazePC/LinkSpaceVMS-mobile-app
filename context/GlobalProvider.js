import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCurrentUser } from "../lib/auth";
import { fetchInvites } from "../lib/invite";
import { router } from "expo-router";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [invites, setInvites] = useState([]);
    const [filteredInvites, setFilteredInvites] = useState([]);
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [user, setUser] = useState(null);
    const [security, setSecurity] = useState(null);
    

    useEffect(() => {
        const initializeUser = async () => {
            try {
                const { user: currentUser, userType } = await getCurrentUser();
                
                if (userType === 'resident') {
                    console.log('User is a resident');
                    setUser(currentUser);
                    setSecurity(null);
                } else if (userType === 'security') {
                    console.log('User is security');
                    setSecurity(currentUser);
                    router.replace('/(security)/(tabs)/securityHome');
                    setUser(null);
                }
    
                setIsLoggedIn(true);
            } catch (error) {
                console.error('Error initializing user:', error);
                setUser(null);
                setSecurity(null);
                setIsLoggedIn(false);
            } finally {
                setIsLoading(false);
            }
        };
    
        initializeUser();
    }, []);

    const fetchAndSetInvites = useCallback(async () => {
        if (!user || !user.address) return;
        try {
            const data = await fetchInvites(user.address, user.id);
            const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setInvites(sortedData);
            setFilteredInvites(sortedData);
        } catch (error) {
            console.error('Error fetching invites:', error.message || error);
        }
    }, [user]);

    const triggerUpdate = useCallback(() => {
        setUpdateTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (user?.address) {
            fetchAndSetInvites();
        }
    }, [user, updateTrigger, fetchAndSetInvites]);


    
    const signOut = useCallback(async () => {
        setIsLoggedIn(false);
        setUser(null);
        setSecurity(null);
        setInvites([]);
        setFilteredInvites([]);
    }, []);

    const updateUserProfile = useCallback((updatedProfile) => {
        setUser(prevUser => ({ ...prevUser, ...updatedProfile }));
    }, []);

    return (
        <GlobalContext.Provider
            value={{
                isLoggedIn,
                setIsLoggedIn,
                user,
                setUser,
                security,
                setSecurity,
                isLoading,
                invites,
                setInvites,
                fetchAndSetInvites,
                filteredInvites,
                setFilteredInvites,
                triggerUpdate,
                signOut,
                updateUserProfile,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export default GlobalProvider;
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCurrentUser } from "../lib/auth";
import { fetchInvites } from "../lib/invite";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [invites, setInvites] = useState([]);
    const [filteredInvites, setFilteredInvites] = useState([]);
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const initializeUser = async () => {
            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                    setIsLoggedIn(true);
                } else {
                    setUser(null);
                    setIsLoggedIn(false);
                }
            } catch (error) {
                console.error('Error initializing user:', error);
                setUser(null);
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
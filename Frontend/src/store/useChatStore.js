import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  socketSubscribed: false,

  // Fetch all users with message history
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Fetch messages for a specific user
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send a new message
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) {
      toast.error("No recipient selected");
      return;
    }

    try {
      // Optimistically add the message to local state
      const tempMessage = {
        ...messageData,
        _id: Date.now().toString(), // Temporary ID
        senderId: useAuthStore.getState().user?._id,
        receiverId: selectedUser._id,
        createdAt: new Date().toISOString(),
        status: "sending",
      };

      set({ messages: [...messages, tempMessage] });

      // Send to server
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      // Replace temp message with server response
      set({
        messages: messages.map((msg) =>
          msg._id === tempMessage._id ? { ...res.data, status: "sent" } : msg
        ),
      });
    } catch (error) {
      // Mark message as failed
      set({
        messages: messages.map((msg) =>
          msg._id === tempMessage._id ? { ...msg, status: "failed" } : msg
        ),
      });
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // Subscribe to real-time messages
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();

    if (!socket || get().socketSubscribed) return;

    console.log("Subscribing to messages...");

    socket.on("newMessage", (newMessage) => {
      const { messages, selectedUser } = get();

      // Check if we already have this message
      if (messages.some((msg) => msg._id === newMessage._id)) return;

      // Add message if:
      // 1. It's from the currently selected user, OR
      // 2. It's sent to the currently selected user (our own messages)
      const shouldAdd =
        newMessage.senderId === selectedUser?._id ||
        newMessage.receiverId === selectedUser?._id;

      if (shouldAdd) {
        set({ messages: [...messages, newMessage] });
      }
    });

    set({ socketSubscribed: true });
  },

  // Unsubscribe from messages
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      console.log("Unsubscribed from messages");
    }
    set({ socketSubscribed: false });
  },

  // Set the currently selected user
  setSelectedUser: (user) => {
    set({ selectedUser: user });
    if (user) {
      get().getMessages(user._id);
    }
  },

  // Clear all messages (when logging out, etc.)
  clearMessages: () => set({ messages: [], selectedUser: null }),
}));

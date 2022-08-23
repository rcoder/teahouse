export enum ChannelName {
    AllEvents     = 'n:ALL_EVENTS',
    Network       = 'n:NETWORK',
    Notifications = 'n:NOTIFICATIONS'
}

export const mkChannel = (name: ChannelName) => new BroadcastChannel(name);

export const AllEvents = mkChannel(ChannelName.AllEvents);
export const Network = mkChannel(ChannelName.Network);
export const Notifications = mkChannel(ChannelName.Notifications);

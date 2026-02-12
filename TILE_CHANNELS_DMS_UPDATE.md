# Channel & DM Tiles Update

## Overview
Transformed channels and DMs into specific tiles that can be added to grids. Users can now choose which channel or conversation to add as a tile, rather than having generic "all messages" tiles.

## Database Changes

### Updated Tile Model
Added new fields to the `Tile` model in `prisma/schema.prisma`:
- `channelId`: Optional reference to a specific channel
- `conversationId`: Optional identifier for a specific DM conversation
- Added relation to `Channel` model

### Updated Channel Model
- Added `tiles` relation to track which tiles display this channel

## New Components

### 1. ChannelTile (`components/ChannelTile.tsx`)
- Displays messages from a specific channel
- Shows channel emoji and name in header
- Real-time message fetching and sending
- Client-side encryption for all messages
- Compact tile design for grid placement

### 2. SelectChannelModal (`components/SelectChannelModal.tsx`)
- Modal to choose which channel to add as a tile
- Lists all available channels (public and private)
- Shows channel emoji, name, and privacy status
- Handles case when no channels exist

### 3. SelectConversationModal (`components/SelectConversationModal.tsx`)
- Modal to create a new DM conversation tile
- Choose between direct (1-on-1) or group conversations
- Enter participant emails
- Optional group name for group conversations

## Updated Components

### DMTile (`components/DMTile.tsx`)
- Now displays a specific conversation instead of all DMs
- Shows conversation name in header
- Inline message display and input
- No longer uses overlay modal
- Messages stored per conversation

### TileMenu (`components/TileMenu.tsx`)
- Added "Channel" option to tile types
- Updated to handle metadata for channel and DM tiles
- Opens selection modals when choosing Channel or DM
- Passes channel/conversation metadata to Grid component

### Grid (`components/Grid.tsx`)
- Updated `TileData` interface to include channel and conversation metadata
- Updated `handleAddTile` to accept and pass metadata
- Renders `ChannelTile` for channel-type tiles
- Passes channel/conversation data to respective tile components

## API Updates

### `/api/tiles/create` (`app/api/tiles/create/route.ts`)
- Accepts channel and conversation metadata
- Stores `channelId` for channel tiles
- Stores `conversationId` for DM tiles
- Returns tile with full metadata to frontend

### Grid Page (`app/grid/page.tsx`)
- Fetches channel data with tiles
- Maps tiles with channel metadata (name, emoji)
- Generates conversation names for DM tiles
- Passes enriched tile data to Grid component

## Features

### Channel Tiles
✅ Add any channel as a tile to any grid  
✅ Each tile shows messages from that specific channel  
✅ Send and receive encrypted messages within the tile  
✅ Channel emoji and name displayed in tile header  
✅ Multiple tiles can show different channels on the same grid  

### DM Tiles
✅ Create specific DM conversations (1-on-1 or group)  
✅ Each tile represents one conversation  
✅ Conversation name displayed in header  
✅ Messages stored per conversation  
✅ Multiple DM tiles can exist on the same grid  

## User Flow

### Adding a Channel Tile
1. Click "Add Tile" button in grid header
2. Select "Channel" from the dropdown
3. Choose a channel from the modal
4. Channel tile appears on the grid
5. Send/receive messages directly in the tile

### Adding a DM Tile
1. Click "Add Tile" button in grid header
2. Select "Messages" from the dropdown
3. Choose conversation type (Direct or Group)
4. Enter participant email(s)
5. Optionally name the group
6. DM tile appears on the grid
7. Send/receive messages directly in the tile

## Privacy & Encryption
- All channel messages remain client-side encrypted
- DM conversation messages stored locally
- Server never sees plaintext content
- Each tile maintains its own encryption context

## Next Steps (Future Enhancements)
- Persist DM conversations to database with encryption
- Add conversation management (rename, add/remove participants)
- Show participant avatars in DM tiles
- Add typing indicators
- Add read receipts
- Show online/offline status
- Add message reactions
- Add file sharing within tiles

## Testing Instructions
1. Navigate to http://localhost:3001
2. Create or select a channel in the sidebar
3. Go to a grid
4. Click "Add Tile" → "Channel"
5. Select the channel you created
6. Verify the channel tile appears with messages
7. Click "Add Tile" → "Messages"
8. Create a DM conversation
9. Verify the DM tile appears
10. Send messages in both tiles
11. Create multiple tiles of each type on the same grid

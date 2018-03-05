import React, { Component } from 'react';
import Video from 'twilio-video';
import axios from 'axios';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import { Card, CardHeader, CardText } from 'material-ui/Card';

export default class VideoComponent extends Component {
	constructor(props) {
		super();
		this.state = {
			identity: null,
			roomName: '',
			roomNameErr: false, // Track error for room name TextField
			previewTracks: null,
			localMediaAvailable: false,
			hasJoinedRoom: false,
			activeRoom: '' // Track the current active room
		};
		this.joinRoom = this.joinRoom.bind(this);
		this.handleRoomNameChange = this.handleRoomNameChange.bind(this);
		this.roomJoined = this.roomJoined.bind(this);
	}

	handleRoomNameChange(e) {
		let roomName = e.target.value;
		this.setState({ roomName });
	}

	joinRoom() {
		if (!this.state.roomName.trim()) {
			this.setState({ roomNameErr: true });
			return;
		}

		console.log("Joining room '" + this.state.roomName + "'...");
		let connectOptions = {
			name: this.state.roomName
		};

		if (this.state.previewTracks) {
			connectOptions.tracks = this.state.previewTracks;
		}

		// Join the Room with the token from the server and the
		// LocalParticipant's Tracks.
		Video.connect(this.state.token, connectOptions).then(this.roomJoined, error => {
			alert('Could not connect to Twilio: ' + error.message);
		});
	}

	attachTracks(tracks, container) {
		tracks.forEach(track => {
			container.appendChild(track.attach());
		});
	}

	// Attaches a track to a specified DOM container
	attachParticipantTracks(participant, container) {
		var tracks = Array.from(participant.tracks.values());
		this.attachTracks(tracks, container);
	}

	detachTracks(tracks) {
		tracks.forEach(track => {
			track.detach().forEach(detachedElement => {
				detachedElement.remove();
			});
		});
	}

	detachParticipantTracks(participant) {
		var tracks = Array.from(participant.tracks.values());
		this.detachTracks(tracks);
	}

	roomJoined(room) {
		// Called when a participant joins a room
		console.log("Joined as '" + this.state.identity + "'");
		this.setState({
			activeRoom: room,
			localMediaAvailable: true,
			hasJoinedRoom: true
		});

		// Attach LocalParticipant's Tracks, if not already attached.
		var previewContainer = this.refs.localMedia;
		if (!previewContainer.querySelector('video')) {
			this.attachParticipantTracks(room.localParticipant, previewContainer);
		}
	}

	componentDidMount() {
		axios.get('/token').then(results => {
			const { identity, token } = results.data;
			this.setState({ identity, token });
		});
	}

	render() {
		// Only show video track after user has joined a room
		let showLocalTrack = this.state.localMediaAvailable ? (
			<div className="flex-item">
				<div ref="localMedia" />
			</div>
		) : '';
		// Hide 'Join Room' button if user has already joined a room.
		let joinOrLeaveRoomButton = this.state.hasJoinedRoom ? (
			<RaisedButton label="Leave Room" secondary={true} onClick={() => alert("Leave Room") } />
		) : (
			<RaisedButton label="Join Room" primary={true} onClick={this.joinRoom} />
		);
		return (
			<Card>
				<CardText>
					<div className="flex-container">
						{showLocalTrack}
						<div className="flex-item">
							<TextField
								hintText="Room Name"
								onChange={this.handleRoomNameChange}
								errorText={this.state.roomNameErr ? 'Room Name is required' : undefined}
							/>
							<br />
							{joinOrLeaveRoomButton}
						</div>
						<div className="flex-item" ref="remoteMedia" id="remote-media" />
					</div>
				</CardText>
			</Card>
		);
	}
}

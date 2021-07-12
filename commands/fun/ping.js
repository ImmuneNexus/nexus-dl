module.exports = {
	name: "ping",
	description: "Ping pong ding dong",
	args: false,
	execute(message, args) {
		message.channel.send("P0ng.");
	},
};

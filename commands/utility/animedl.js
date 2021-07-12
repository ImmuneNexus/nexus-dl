//allow dynamicy (allow user to choose site)
//comment code
//fix crashes and bugs
//allow testing
//handle no results found

const fetch = require("node-fetch");
const cheerio = require("cheerio");
const { MessageEmbed, DMChannel } = require("discord.js");
const { data } = require("cheerio/lib/api/attributes");

module.exports = {
	name: "animedl",
	description: "get links to aimme yes",
	args: true,
	async execute(message, args) {
		async function scrape() {
			const linkArray = [];
			const linksOnly = [];
			const grabAnimeInfo = await fetch(
				`https://subsplease.org/api/?f=search&tz=America&s=${args.join("%20")}`
			);
			const jsonifiedAnimeInfo = await grabAnimeInfo.json();
			const objifiedAnimeInfo = await JSON.parse(
				JSON.stringify(jsonifiedAnimeInfo)
			);
			if (Object.keys(jsonifiedAnimeInfo).length > 0) {
				for (const [ep, info] of Object.entries(objifiedAnimeInfo)) {
					for (const qualityObj of info.downloads) {
						const res = qualityObj["res"] + "p";
						//fix here noov
						linkArray.push({
							animeName: ep,
							animeQuality: [res],
							animeLink: qualityObj["magnet"],
						});
						linksOnly.push(`${qualityObj["magnet"]}`);
					}
				}

				//https://subsplease.org/xdcc/?search=%22%5BSubsPlease%5D+Jujutsu+Kaisen+-+16%22
				const requestShortenLinks = await fetch(
					"https://tormag.ezpz.work/api/api.php?action=insertMagnets",
					{
						method: "POST",
						body: JSON.stringify({ magnets: linksOnly }),
						headers: {
							Host: "tormag.ezpz.work",
							Connection: "keep-alive",
							Accept: "*/*",
							"X-Requested-With": "XMLHttpRequest",
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
							"Content-Type": "application/json",
							"Sec-GPC": "1",
							Origin: "https://tormag.ezpz.work",
							"Sec-Fetch-Site": "same-origin",
							"Sec-Fetch-Mode": "cors",
							"Sec-Fetch-Dest": "empty",
							Referer: "https://tormag.ezpz.work/",
							"Accept-Encoding": "gzip, deflate, br",
							"Accept-Language": "en-CA,en;q=0.9",
						},
					}
				);
				const shortenLinks = JSON.parse(
					JSON.stringify(await requestShortenLinks.json())
				);
				const dataObj = {};
				for (const [index, shortlink] of shortenLinks.magnetEntries.entries()) {
					dataObj[linkArray[index].animeName] = {
						...dataObj[linkArray[index].animeName],
						...{ [linkArray[index].animeQuality]: shortlink },
					};
				}
				return dataObj;
			} else return null;
		}
		const infoObj = await scrape();
		if (infoObj) {
			const fieldArray = [];
			for (const [anime, dataObj] of Object.entries(infoObj)) {
				const linksString = [];
				for (const [quality, link] of Object.entries(dataObj)) {
					linksString.push(`[${quality}](${link})`);
				}
				fieldArray.push({
					name: anime,
					value: linksString.join(", "),
				});
			}

			const arrayLength = fieldArray.length;
			const limit = 5;
			const maxPages =
				arrayLength % limit
					? Math.floor(arrayLength / limit + 1)
					: arrayLength / limit;

			const resultsMessage = await message.channel.send(
				new MessageEmbed({ title: "**Results**" }).addFields(
					fieldArray.slice(0, limit)
				)
			);
			let page = 1;
			await resultsMessage.react("⬅");
			await resultsMessage.react("➡");

			const filter = (reaction, user) => {
				return (
					reaction.emoji.name == "⬅" ||
					(reaction.emoji.name == "➡" && user.id == message.author.id)
				);
			};
			const reactionCollector = await resultsMessage.createReactionCollector(
				filter
			);
			setTimeout(async () => {
				await resultsMessage.edit(
					"This session has timed out; Use the command again for further browsing."
				);
				await reactionCollector.stop("Timeout: Please use the command again.");
			}, 300000);
			reactionCollector.on("collect", async (reactionReceived, userReacted) => {
				if (reactionReceived.emoji.name == "➡" && page < maxPages) {
					page++;
					await resultsMessage.edit(
						new MessageEmbed({ title: "**Results**" }).addFields(
							fieldArray.slice((page - 1) * limit, page * limit)
						)
					);
				} else if (reactionReceived.emoji.name == "⬅" && page > 1) {
					page--;
					await resultsMessage.edit(
						new MessageEmbed({ title: "**Results**" }).addFields(
							fieldArray.slice((page - 1) * limit, page * limit)
						)
					);
				}
				await reactionReceived.users.remove(message.author.id);
			});
		} else {
			await message.channel.send("no results found");
		}
	},
};

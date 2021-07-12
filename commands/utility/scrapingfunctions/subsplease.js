module.exports = {
	async scrapeSubsPlease() {
		const table = document.querySelector("#releases-table");
		const collection = table.children;
		const animeinfo = [];
		for (const element of collection) {
			const animeName = element
				.querySelector(".release-item")
				.querySelector("a").innerHTML;
			const animeLinks = [];
			for (const aLink of element.querySelector(".badge-wrapper").children) {
				//fix this (await for promise to resolve)
				const res = await fetch(
					`http://mgnet.me/api/create?m=${aLink.href}&format=text`
				);
				const link = await res.text();
				const quality = aLink.querySelector("span").innerHTML;
				animeLinks.push({
					animeQuality: quality,
					animeLink: link,
				});
			}
			animeinfo.push({ anime: animeName, links: animeLinks });
		}
		return animeinfo;
	},
};

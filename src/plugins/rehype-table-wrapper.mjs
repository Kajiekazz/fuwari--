/**
 * rehype-table-wrapper
 *
 * Wraps every <table> of a markdown document in a scroll container, so a table
 * wider than the article body scrolls horizontally instead of overflowing the
 * page (which used to push the whole layout sideways on mobile).
 *
 * Output shape:
 *   <div class="table-wrapper"><table>...</table></div>
 */

function isTable(node) {
	return node && node.type === "element" && node.tagName === "table";
}

export function rehypeTableWrapper() {
	return (tree) => {
		const walk = (node) => {
			if (!node || !Array.isArray(node.children)) {
				return;
			}

			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i];

				if (isTable(child)) {
					node.children[i] = {
						type: "element",
						tagName: "div",
						properties: { className: ["table-wrapper"] },
						children: [child],
					};
					// The table itself cannot contain another table we care about,
					// so there is no need to descend into the fresh wrapper.
					continue;
				}

				walk(child);
			}
		};

		walk(tree);
	};
}

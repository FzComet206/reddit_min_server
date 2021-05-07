export const validatePost = (title, text) => {
	if (
		title.length == 0 ||
		title.length > 100 ||
		text.length == 0 ||
		text.length > 3000
	) {
		return false;
	} else {
        // maybe add hate speech filter after
		return true;
	}
};

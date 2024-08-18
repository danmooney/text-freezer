export function freeze(targetNode) {
    // Options for the observer (which mutations to observe)
    const config = {
        attributeOldValue: true,
        characterDataOldValue: true,
        characterData: true,
        attributes: true,
        childList: true,
        subtree: true
    };

    const textNodeOriginalValueMap = new Map();
    const originalHTML = targetNode.innerHTML;

    // Callback function to execute when mutations are observed
    const callback = (mutationList, observer) => {
        for (const mutation of mutationList) {
            if (mutation.target.isChangeInProgress) {
                continue;
            }

            if (mutation.type === 'characterData') {
                if (!textNodeOriginalValueMap.get(mutation.target)) {
                    textNodeOriginalValueMap.set(mutation.target, mutation.oldValue === null ? mutation.target.textContent : mutation.oldValue);
                } else if (mutation.target.textContent === textNodeOriginalValueMap.get(mutation.target)) {
                    continue;
                }

                if (mutation.oldValue === null) {
                    textNodeOriginalValueMap.set(mutation.target, mutation.target.textContent);
                    continue;
                }

                mutation.target.isChangeInProgress = true;

                // revert value
                mutation.target.textContent = textNodeOriginalValueMap.get(mutation.target);
            } else if (mutation.type === 'childList') {
                mutation.target.isChangeInProgress = true;

                // Revert to original HTML if child nodes are added or removed
                targetNode.innerHTML = originalHTML;
            }

            setTimeout(() => {
                // reset lock
                mutation.target.isChangeInProgress = false;
            });
        }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);

    // Later, you can stop observing
    // observer.disconnect();
}

export default { freeze };

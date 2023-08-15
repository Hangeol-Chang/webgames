import { atom } from 'recoil';

// image prefix
const prefixState = atom<string>({
    key : 'prefixState',
    default : process.env.NODE_ENV === "production"
        ? `https://hangeol-chang.github.io/webgames`
        : "", 
})

// link prefix
const relativePrefixState = atom<string>({
    key : 'relativePrefixState',
    default : process.env.NODE_ENV === "production"
        ? `/webgames`
        : ``,
})

export {
    prefixState,
    relativePrefixState,
};
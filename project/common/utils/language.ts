// load selected language from static/language/<language>.json
// if language is not found, load english as default
// if english is not found, throw error

// should convert object into key-value pair for easier access and support nested keys,
// e.g. lang('common.greeting', <replacements args>) instead of language['common']['greeting']

// should have smart functions for replacing placeholders in the language string,
// e.g. lang('common.greeting', { name: 'John' }) => "Hello, John!" if the language string is "Hello, {name}!"

// and be smart so that language dosent need to have same text twice it should be able to load bases of the language file,
// e.g. hello: "hello, $(world)", world: "world" => lang('hello') should return "hello, world" without the need to have "hello, world" in the language file
// and still load replacement place holders,
// e.g. hello: "hello, $(world)", world: "world" => lang('hello', { world: 'everyone' }) should return "hello, everyone"
// or e.g. hello: "hello, $(person)", person: "{sex = "male" ("sir"), ("mis")} {name}"

// dont yet now the language format like {} $() or what indentation to equal what.

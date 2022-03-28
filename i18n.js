const PropertiesReader = require('properties-reader');
const prop_pt_BR = PropertiesReader('./locales/pt-BR/translation.properties');
const prop_en_US = PropertiesReader('./locales/en-US/translation.properties');

exports.getString = (key, lang) => {
    if(lang === 'pt-br'){
        return prop_pt_BR.get(key);
    }else{
        return prop_en_US.get(key);
    }

}
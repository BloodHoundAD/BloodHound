import {groupSpecialFormat, typeFormat} from "../Formatter";

const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `${groupSpecialFormat(sourceType, sourceName)} the ability to write to the "serviceprincipalname" attribute to the ${typeFormat(targetType)} ${targetName}.`

    return { __html: text }
}

export default General;
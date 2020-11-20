const General = (sourceName, sourceType, targetName, targetType) => {
    let text = `This edge indicates the principal has the Global Admin role active against the target tenant. In other words, the principal is a Global Admin. Global Admins can do almost anything against almost every object type in the tenant, this is the highest privilege role in Azure.`;
    return { __html: text };
};

export default General;

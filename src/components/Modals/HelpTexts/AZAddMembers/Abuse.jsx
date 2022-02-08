const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `Via the Azure portal:
    <ol>
    <li>Find the group in your tenant (Azure Active Directory -> Groups -> Find Group in list)</li>
    <li>Click the group from the list</li>
    <li>In the left pane, click “Members”</li>
    <li>At the top, click “Add members”</li>
    <li>Find the principals you want to add to the group and click them, then click “select” at the bottom</li>
    <li>You should see a message in the top right saying “Member successfully added”</li>
    </ol>
    
    Via PowerZure: Add-AzureADGroup -User [UPN] -Group [Group name]
    `;
    return { __html: text };
};

export default Abuse;

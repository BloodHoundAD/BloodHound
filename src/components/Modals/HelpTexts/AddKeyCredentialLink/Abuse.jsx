const Abuse = (sourceName, sourceType, targetName, targetType) => {
    let text = `To abuse this privilege, use Whisker. 
    
    You may need to authenticate to the Domain Controller as ${
        (sourceType === 'User' || sourceType === 'Computer')
            ? `${sourceName} if you are not running a process as that user/computer`
            : `a member of ${sourceName} if you are not running a process as a member`
    }.
    
    <code>Whisker.exe add /target:<TargetPrincipal>

    For other optional parameters, view the Whisper documentation.`

    return { __html: text }
}

export default Abuse;
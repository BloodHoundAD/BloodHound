#requires -version 2

<#
    Customized PowerView instance for BloodHound data collection and ingestion.

    Author: Will Schroeder (@harmj0y)
    License: BSD 3-Clause
    Required Dependencies: None
    Optional Dependencies: None
#>

########################################################
#
# PSReflect code for Windows API access
# Author: @mattifestation
#   https://raw.githubusercontent.com/mattifestation/PSReflect/master/PSReflect.psm1
#
########################################################

function New-InMemoryModule
{
<#
    .SYNOPSIS

        Creates an in-memory assembly and module

        Author: Matthew Graeber (@mattifestation)
        License: BSD 3-Clause
        Required Dependencies: None
        Optional Dependencies: None

    .DESCRIPTION

        When defining custom enums, structs, and unmanaged functions, it is
        necessary to associate to an assembly module. This helper function
        creates an in-memory module that can be passed to the 'enum',
        'struct', and Add-Win32Type functions.

    .PARAMETER ModuleName

        Specifies the desired name for the in-memory assembly and module. If
        ModuleName is not provided, it will default to a GUID.

    .EXAMPLE

        $Module = New-InMemoryModule -ModuleName Win32
#>

    Param
    (
        [Parameter(Position = 0)]
        [ValidateNotNullOrEmpty()]
        [String]
        $ModuleName = [Guid]::NewGuid().ToString()
    )

    $LoadedAssemblies = [AppDomain]::CurrentDomain.GetAssemblies()

    ForEach ($Assembly in $LoadedAssemblies) {
        if ($Assembly.FullName -and ($Assembly.FullName.Split(',')[0] -eq $ModuleName)) {
            return $Assembly
        }
    }

    $DynAssembly = New-Object Reflection.AssemblyName($ModuleName)
    $Domain = [AppDomain]::CurrentDomain
    $AssemblyBuilder = $Domain.DefineDynamicAssembly($DynAssembly, 'Run')
    $ModuleBuilder = $AssemblyBuilder.DefineDynamicModule($ModuleName, $False)

    return $ModuleBuilder
}


# A helper function used to reduce typing while defining function
# prototypes for Add-Win32Type.
function func
{
    Param
    (
        [Parameter(Position = 0, Mandatory = $True)]
        [String]
        $DllName,

        [Parameter(Position = 1, Mandatory = $True)]
        [String]
        $FunctionName,

        [Parameter(Position = 2, Mandatory = $True)]
        [Type]
        $ReturnType,

        [Parameter(Position = 3)]
        [Type[]]
        $ParameterTypes,

        [Parameter(Position = 4)]
        [Runtime.InteropServices.CallingConvention]
        $NativeCallingConvention,

        [Parameter(Position = 5)]
        [Runtime.InteropServices.CharSet]
        $Charset,

        [Switch]
        $SetLastError
    )

    $Properties = @{
        DllName = $DllName
        FunctionName = $FunctionName
        ReturnType = $ReturnType
    }

    if ($ParameterTypes) { $Properties['ParameterTypes'] = $ParameterTypes }
    if ($NativeCallingConvention) { $Properties['NativeCallingConvention'] = $NativeCallingConvention }
    if ($Charset) { $Properties['Charset'] = $Charset }
    if ($SetLastError) { $Properties['SetLastError'] = $SetLastError }

    New-Object PSObject -Property $Properties
}


function Add-Win32Type
{
<#
    .SYNOPSIS

        Creates a .NET type for an unmanaged Win32 function.

        Author: Matthew Graeber (@mattifestation)
        License: BSD 3-Clause
        Required Dependencies: None
        Optional Dependencies: func

    .DESCRIPTION

        Add-Win32Type enables you to easily interact with unmanaged (i.e.
        Win32 unmanaged) functions in PowerShell. After providing
        Add-Win32Type with a function signature, a .NET type is created
        using reflection (i.e. csc.exe is never called like with Add-Type).

        The 'func' helper function can be used to reduce typing when defining
        multiple function definitions.

    .PARAMETER DllName

        The name of the DLL.

    .PARAMETER FunctionName

        The name of the target function.

    .PARAMETER ReturnType

        The return type of the function.

    .PARAMETER ParameterTypes

        The function parameters.

    .PARAMETER NativeCallingConvention

        Specifies the native calling convention of the function. Defaults to
        stdcall.

    .PARAMETER Charset

        If you need to explicitly call an 'A' or 'W' Win32 function, you can
        specify the character set.

    .PARAMETER SetLastError

        Indicates whether the callee calls the SetLastError Win32 API
        function before returning from the attributed method.

    .PARAMETER Module

        The in-memory module that will host the functions. Use
        New-InMemoryModule to define an in-memory module.

    .PARAMETER Namespace

        An optional namespace to prepend to the type. Add-Win32Type defaults
        to a namespace consisting only of the name of the DLL.

    .EXAMPLE

        $Mod = New-InMemoryModule -ModuleName Win32

        $FunctionDefinitions = @(
          (func kernel32 GetProcAddress ([IntPtr]) @([IntPtr], [String]) -Charset Ansi -SetLastError),
          (func kernel32 GetModuleHandle ([Intptr]) @([String]) -SetLastError),
          (func ntdll RtlGetCurrentPeb ([IntPtr]) @())
        )

        $Types = $FunctionDefinitions | Add-Win32Type -Module $Mod -Namespace 'Win32'
        $Kernel32 = $Types['kernel32']
        $Ntdll = $Types['ntdll']
        $Ntdll::RtlGetCurrentPeb()
        $ntdllbase = $Kernel32::GetModuleHandle('ntdll')
        $Kernel32::GetProcAddress($ntdllbase, 'RtlGetCurrentPeb')

    .NOTES

        Inspired by Lee Holmes' Invoke-WindowsApi http://poshcode.org/2189

        When defining multiple function prototypes, it is ideal to provide
        Add-Win32Type with an array of function signatures. That way, they
        are all incorporated into the same in-memory module.
#>

    [OutputType([Hashtable])]
    Param(
        [Parameter(Mandatory = $True, ValueFromPipelineByPropertyName = $True)]
        [String]
        $DllName,

        [Parameter(Mandatory = $True, ValueFromPipelineByPropertyName = $True)]
        [String]
        $FunctionName,

        [Parameter(Mandatory = $True, ValueFromPipelineByPropertyName = $True)]
        [Type]
        $ReturnType,

        [Parameter(ValueFromPipelineByPropertyName = $True)]
        [Type[]]
        $ParameterTypes,

        [Parameter(ValueFromPipelineByPropertyName = $True)]
        [Runtime.InteropServices.CallingConvention]
        $NativeCallingConvention = [Runtime.InteropServices.CallingConvention]::StdCall,

        [Parameter(ValueFromPipelineByPropertyName = $True)]
        [Runtime.InteropServices.CharSet]
        $Charset = [Runtime.InteropServices.CharSet]::Auto,

        [Parameter(ValueFromPipelineByPropertyName = $True)]
        [Switch]
        $SetLastError,

        [Parameter(Mandatory = $True)]
        [ValidateScript({($_ -is [Reflection.Emit.ModuleBuilder]) -or ($_ -is [Reflection.Assembly])})]
        $Module,

        [ValidateNotNull()]
        [String]
        $Namespace = ''
    )

    BEGIN
    {
        $TypeHash = @{}
    }

    PROCESS
    {
        if ($Module -is [Reflection.Assembly])
        {
            if ($Namespace)
            {
                $TypeHash[$DllName] = $Module.GetType("$Namespace.$DllName")
            }
            else
            {
                $TypeHash[$DllName] = $Module.GetType($DllName)
            }
        }
        else
        {
            # Define one type for each DLL
            if (!$TypeHash.ContainsKey($DllName))
            {
                if ($Namespace)
                {
                    $TypeHash[$DllName] = $Module.DefineType("$Namespace.$DllName", 'Public,BeforeFieldInit')
                }
                else
                {
                    $TypeHash[$DllName] = $Module.DefineType($DllName, 'Public,BeforeFieldInit')
                }
            }

            $Method = $TypeHash[$DllName].DefineMethod(
                $FunctionName,
                'Public,Static,PinvokeImpl',
                $ReturnType,
                $ParameterTypes)

            # Make each ByRef parameter an Out parameter
            $i = 1
            ForEach($Parameter in $ParameterTypes)
            {
                if ($Parameter.IsByRef)
                {
                    [void] $Method.DefineParameter($i, 'Out', $Null)
                }

                $i++
            }

            $DllImport = [Runtime.InteropServices.DllImportAttribute]
            $SetLastErrorField = $DllImport.GetField('SetLastError')
            $CallingConventionField = $DllImport.GetField('CallingConvention')
            $CharsetField = $DllImport.GetField('CharSet')
            if ($SetLastError) { $SLEValue = $True } else { $SLEValue = $False }

            # Equivalent to C# version of [DllImport(DllName)]
            $Constructor = [Runtime.InteropServices.DllImportAttribute].GetConstructor([String])
            $DllImportAttribute = New-Object Reflection.Emit.CustomAttributeBuilder($Constructor,
                $DllName, [Reflection.PropertyInfo[]] @(), [Object[]] @(),
                [Reflection.FieldInfo[]] @($SetLastErrorField, $CallingConventionField, $CharsetField),
                [Object[]] @($SLEValue, ([Runtime.InteropServices.CallingConvention] $NativeCallingConvention), ([Runtime.InteropServices.CharSet] $Charset)))

            $Method.SetCustomAttribute($DllImportAttribute)
        }
    }

    END
    {
        if ($Module -is [Reflection.Assembly])
        {
            return $TypeHash
        }

        $ReturnTypes = @{}

        ForEach ($Key in $TypeHash.Keys)
        {
            $Type = $TypeHash[$Key].CreateType()

            $ReturnTypes[$Key] = $Type
        }

        return $ReturnTypes
    }
}


function psenum
{
<#
    .SYNOPSIS

        Creates an in-memory enumeration for use in your PowerShell session.

        Author: Matthew Graeber (@mattifestation)
        License: BSD 3-Clause
        Required Dependencies: None
        Optional Dependencies: None
     
    .DESCRIPTION

        The 'psenum' function facilitates the creation of enums entirely in
        memory using as close to a "C style" as PowerShell will allow.

    .PARAMETER Module

        The in-memory module that will host the enum. Use
        New-InMemoryModule to define an in-memory module.

    .PARAMETER FullName

        The fully-qualified name of the enum.

    .PARAMETER Type

        The type of each enum element.

    .PARAMETER EnumElements

        A hashtable of enum elements.

    .PARAMETER Bitfield

        Specifies that the enum should be treated as a bitfield.

    .EXAMPLE

        $Mod = New-InMemoryModule -ModuleName Win32

        $ImageSubsystem = psenum $Mod PE.IMAGE_SUBSYSTEM UInt16 @{
            UNKNOWN =                  0
            NATIVE =                   1 # Image doesn't require a subsystem.
            WINDOWS_GUI =              2 # Image runs in the Windows GUI subsystem.
            WINDOWS_CUI =              3 # Image runs in the Windows character subsystem.
            OS2_CUI =                  5 # Image runs in the OS/2 character subsystem.
            POSIX_CUI =                7 # Image runs in the Posix character subsystem.
            NATIVE_WINDOWS =           8 # Image is a native Win9x driver.
            WINDOWS_CE_GUI =           9 # Image runs in the Windows CE subsystem.
            EFI_APPLICATION =          10
            EFI_BOOT_SERVICE_DRIVER =  11
            EFI_RUNTIME_DRIVER =       12
            EFI_ROM =                  13
            XBOX =                     14
            WINDOWS_BOOT_APPLICATION = 16
        }

    .NOTES

        PowerShell purists may disagree with the naming of this function but
        again, this was developed in such a way so as to emulate a "C style"
        definition as closely as possible. Sorry, I'm not going to name it
        New-Enum. :P
#>

    [OutputType([Type])]
    Param
    (
        [Parameter(Position = 0, Mandatory = $True)]
        [ValidateScript({($_ -is [Reflection.Emit.ModuleBuilder]) -or ($_ -is [Reflection.Assembly])})]
        $Module,

        [Parameter(Position = 1, Mandatory = $True)]
        [ValidateNotNullOrEmpty()]
        [String]
        $FullName,

        [Parameter(Position = 2, Mandatory = $True)]
        [Type]
        $Type,

        [Parameter(Position = 3, Mandatory = $True)]
        [ValidateNotNullOrEmpty()]
        [Hashtable]
        $EnumElements,

        [Switch]
        $Bitfield
    )

    if ($Module -is [Reflection.Assembly])
    {
        return ($Module.GetType($FullName))
    }

    $EnumType = $Type -as [Type]

    $EnumBuilder = $Module.DefineEnum($FullName, 'Public', $EnumType)

    if ($Bitfield)
    {
        $FlagsConstructor = [FlagsAttribute].GetConstructor(@())
        $FlagsCustomAttribute = New-Object Reflection.Emit.CustomAttributeBuilder($FlagsConstructor, @())
        $EnumBuilder.SetCustomAttribute($FlagsCustomAttribute)
    }

    ForEach ($Key in $EnumElements.Keys)
    {
        # Apply the specified enum type to each element
        $Null = $EnumBuilder.DefineLiteral($Key, $EnumElements[$Key] -as $EnumType)
    }

    $EnumBuilder.CreateType()
}


# A helper function used to reduce typing while defining struct
# fields.
function field
{
    Param
    (
        [Parameter(Position = 0, Mandatory = $True)]
        [UInt16]
        $Position,

        [Parameter(Position = 1, Mandatory = $True)]
        [Type]
        $Type,

        [Parameter(Position = 2)]
        [UInt16]
        $Offset,

        [Object[]]
        $MarshalAs
    )

    @{
        Position = $Position
        Type = $Type -as [Type]
        Offset = $Offset
        MarshalAs = $MarshalAs
    }
}


function struct
{
<#
    .SYNOPSIS

        Creates an in-memory struct for use in your PowerShell session.

        Author: Matthew Graeber (@mattifestation)
        License: BSD 3-Clause
        Required Dependencies: None
        Optional Dependencies: field

    .DESCRIPTION

        The 'struct' function facilitates the creation of structs entirely in
        memory using as close to a "C style" as PowerShell will allow. Struct
        fields are specified using a hashtable where each field of the struct
        is comprosed of the order in which it should be defined, its .NET
        type, and optionally, its offset and special marshaling attributes.

        One of the features of 'struct' is that after your struct is defined,
        it will come with a built-in GetSize method as well as an explicit
        converter so that you can easily cast an IntPtr to the struct without
        relying upon calling SizeOf and/or PtrToStructure in the Marshal
        class.

    .PARAMETER Module

        The in-memory module that will host the struct. Use
        New-InMemoryModule to define an in-memory module.

    .PARAMETER FullName

        The fully-qualified name of the struct.

    .PARAMETER StructFields

        A hashtable of fields. Use the 'field' helper function to ease
        defining each field.

    .PARAMETER PackingSize

        Specifies the memory alignment of fields.

    .PARAMETER ExplicitLayout

        Indicates that an explicit offset for each field will be specified.

    .EXAMPLE

        $Mod = New-InMemoryModule -ModuleName Win32

        $ImageDosSignature = psenum $Mod PE.IMAGE_DOS_SIGNATURE UInt16 @{
            DOS_SIGNATURE =    0x5A4D
            OS2_SIGNATURE =    0x454E
            OS2_SIGNATURE_LE = 0x454C
            VXD_SIGNATURE =    0x454C
        }

        $ImageDosHeader = struct $Mod PE.IMAGE_DOS_HEADER @{
            e_magic =    field 0 $ImageDosSignature
            e_cblp =     field 1 UInt16
            e_cp =       field 2 UInt16
            e_crlc =     field 3 UInt16
            e_cparhdr =  field 4 UInt16
            e_minalloc = field 5 UInt16
            e_maxalloc = field 6 UInt16
            e_ss =       field 7 UInt16
            e_sp =       field 8 UInt16
            e_csum =     field 9 UInt16
            e_ip =       field 10 UInt16
            e_cs =       field 11 UInt16
            e_lfarlc =   field 12 UInt16
            e_ovno =     field 13 UInt16
            e_res =      field 14 UInt16[] -MarshalAs @('ByValArray', 4)
            e_oemid =    field 15 UInt16
            e_oeminfo =  field 16 UInt16
            e_res2 =     field 17 UInt16[] -MarshalAs @('ByValArray', 10)
            e_lfanew =   field 18 Int32
        }

        # Example of using an explicit layout in order to create a union.
        $TestUnion = struct $Mod TestUnion @{
            field1 = field 0 UInt32 0
            field2 = field 1 IntPtr 0
        } -ExplicitLayout

    .NOTES

        PowerShell purists may disagree with the naming of this function but
        again, this was developed in such a way so as to emulate a "C style"
        definition as closely as possible. Sorry, I'm not going to name it
        New-Struct. :P
#>

    [OutputType([Type])]
    Param
    (
        [Parameter(Position = 1, Mandatory = $True)]
        [ValidateScript({($_ -is [Reflection.Emit.ModuleBuilder]) -or ($_ -is [Reflection.Assembly])})]
        $Module,

        [Parameter(Position = 2, Mandatory = $True)]
        [ValidateNotNullOrEmpty()]
        [String]
        $FullName,

        [Parameter(Position = 3, Mandatory = $True)]
        [ValidateNotNullOrEmpty()]
        [Hashtable]
        $StructFields,

        [Reflection.Emit.PackingSize]
        $PackingSize = [Reflection.Emit.PackingSize]::Unspecified,

        [Switch]
        $ExplicitLayout
    )

    if ($Module -is [Reflection.Assembly])
    {
        return ($Module.GetType($FullName))
    }

    [Reflection.TypeAttributes] $StructAttributes = 'AnsiClass,
        Class,
        Public,
        Sealed,
        BeforeFieldInit'

    if ($ExplicitLayout)
    {
        $StructAttributes = $StructAttributes -bor [Reflection.TypeAttributes]::ExplicitLayout
    }
    else
    {
        $StructAttributes = $StructAttributes -bor [Reflection.TypeAttributes]::SequentialLayout
    }

    $StructBuilder = $Module.DefineType($FullName, $StructAttributes, [ValueType], $PackingSize)
    $ConstructorInfo = [Runtime.InteropServices.MarshalAsAttribute].GetConstructors()[0]
    $SizeConst = @([Runtime.InteropServices.MarshalAsAttribute].GetField('SizeConst'))

    $Fields = New-Object Hashtable[]($StructFields.Count)

    # Sort each field according to the orders specified
    # Unfortunately, PSv2 doesn't have the luxury of the
    # hashtable [Ordered] accelerator.
    ForEach ($Field in $StructFields.Keys)
    {
        $Index = $StructFields[$Field]['Position']
        $Fields[$Index] = @{FieldName = $Field; Properties = $StructFields[$Field]}
    }

    ForEach ($Field in $Fields)
    {
        $FieldName = $Field['FieldName']
        $FieldProp = $Field['Properties']

        $Offset = $FieldProp['Offset']
        $Type = $FieldProp['Type']
        $MarshalAs = $FieldProp['MarshalAs']

        $NewField = $StructBuilder.DefineField($FieldName, $Type, 'Public')

        if ($MarshalAs)
        {
            $UnmanagedType = $MarshalAs[0] -as ([Runtime.InteropServices.UnmanagedType])
            if ($MarshalAs[1])
            {
                $Size = $MarshalAs[1]
                $AttribBuilder = New-Object Reflection.Emit.CustomAttributeBuilder($ConstructorInfo,
                    $UnmanagedType, $SizeConst, @($Size))
            }
            else
            {
                $AttribBuilder = New-Object Reflection.Emit.CustomAttributeBuilder($ConstructorInfo, [Object[]] @($UnmanagedType))
            }

            $NewField.SetCustomAttribute($AttribBuilder)
        }

        if ($ExplicitLayout) { $NewField.SetOffset($Offset) }
    }

    # Make the struct aware of its own size.
    # No more having to call [Runtime.InteropServices.Marshal]::SizeOf!
    $SizeMethod = $StructBuilder.DefineMethod('GetSize',
        'Public, Static',
        [Int],
        [Type[]] @())
    $ILGenerator = $SizeMethod.GetILGenerator()
    # Thanks for the help, Jason Shirk!
    $ILGenerator.Emit([Reflection.Emit.OpCodes]::Ldtoken, $StructBuilder)
    $ILGenerator.Emit([Reflection.Emit.OpCodes]::Call,
        [Type].GetMethod('GetTypeFromHandle'))
    $ILGenerator.Emit([Reflection.Emit.OpCodes]::Call,
        [Runtime.InteropServices.Marshal].GetMethod('SizeOf', [Type[]] @([Type])))
    $ILGenerator.Emit([Reflection.Emit.OpCodes]::Ret)

    # Allow for explicit casting from an IntPtr
    # No more having to call [Runtime.InteropServices.Marshal]::PtrToStructure!
    $ImplicitConverter = $StructBuilder.DefineMethod('op_Implicit',
        'PrivateScope, Public, Static, HideBySig, SpecialName',
        $StructBuilder,
        [Type[]] @([IntPtr]))
    $ILGenerator2 = $ImplicitConverter.GetILGenerator()
    $ILGenerator2.Emit([Reflection.Emit.OpCodes]::Nop)
    $ILGenerator2.Emit([Reflection.Emit.OpCodes]::Ldarg_0)
    $ILGenerator2.Emit([Reflection.Emit.OpCodes]::Ldtoken, $StructBuilder)
    $ILGenerator2.Emit([Reflection.Emit.OpCodes]::Call,
        [Type].GetMethod('GetTypeFromHandle'))
    $ILGenerator2.Emit([Reflection.Emit.OpCodes]::Call,
        [Runtime.InteropServices.Marshal].GetMethod('PtrToStructure', [Type[]] @([IntPtr], [Type])))
    $ILGenerator2.Emit([Reflection.Emit.OpCodes]::Unbox_Any, $StructBuilder)
    $ILGenerator2.Emit([Reflection.Emit.OpCodes]::Ret)

    $StructBuilder.CreateType()
}


filter Get-IPAddress {
<#
    .SYNOPSIS

        Resolves a given hostename to its associated IPv4 address. 
        If no hostname is provided, it defaults to returning
        the IP address of the localhost.

    .EXAMPLE

        PS C:\> Get-IPAddress -ComputerName SERVER
        
        Return the IPv4 address of 'SERVER'

    .EXAMPLE

        PS C:\> Get-Content .\hostnames.txt | Get-IPAddress

        Get the IP addresses of all hostnames in an input file.
#>

    [CmdletBinding()]
    param(
        [Parameter(Position=0, ValueFromPipeline=$True)]
        [Alias('HostName')]
        [String]
        $ComputerName = $Env:ComputerName
    )

    try {
        # extract the computer name from whatever object was passed on the pipeline
        $Computer = $ComputerName | Get-NameField

        # get the IP resolution of this specified hostname
        @(([Net.Dns]::GetHostEntry($Computer)).AddressList) | ForEach-Object {
            if ($_.AddressFamily -eq 'InterNetwork') {
                $Out = New-Object PSObject
                $Out | Add-Member Noteproperty 'ComputerName' $Computer
                $Out | Add-Member Noteproperty 'IPAddress' $_.IPAddressToString
                $Out
            }
        }
    }
    catch {
        Write-Verbose -Message 'Could not resolve host to an IP Address.'
    }
}


filter Convert-SidToName {
<#
    .SYNOPSIS
    
        Converts a security identifier (SID) to a group/user name.

    .PARAMETER SID
    
        The SID to convert.

    .EXAMPLE

        PS C:\> Convert-SidToName S-1-5-21-2620891829-2411261497-1773853088-1105
#>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$True, ValueFromPipeline=$True)]
        [String]
        [ValidatePattern('^S-1-.*')]
        $SID
    )

    try {
        $SID2 = $SID.trim('*')

        # try to resolve any built-in SIDs first
        #   from https://support.microsoft.com/en-us/kb/243330
        Switch ($SID2)
        {
            'S-1-0'         { 'Null Authority' }
            'S-1-0-0'       { 'Nobody' }
            'S-1-1'         { 'World Authority' }
            'S-1-1-0'       { 'Everyone' }
            'S-1-2'         { 'Local Authority' }
            'S-1-2-0'       { 'Local' }
            'S-1-2-1'       { 'Console Logon ' }
            'S-1-3'         { 'Creator Authority' }
            'S-1-3-0'       { 'Creator Owner' }
            'S-1-3-1'       { 'Creator Group' }
            'S-1-3-2'       { 'Creator Owner Server' }
            'S-1-3-3'       { 'Creator Group Server' }
            'S-1-3-4'       { 'Owner Rights' }
            'S-1-4'         { 'Non-unique Authority' }
            'S-1-5'         { 'NT Authority' }
            'S-1-5-1'       { 'Dialup' }
            'S-1-5-2'       { 'Network' }
            'S-1-5-3'       { 'Batch' }
            'S-1-5-4'       { 'Interactive' }
            'S-1-5-6'       { 'Service' }
            'S-1-5-7'       { 'Anonymous' }
            'S-1-5-8'       { 'Proxy' }
            'S-1-5-9'       { 'Enterprise Domain Controllers' }
            'S-1-5-10'      { 'Principal Self' }
            'S-1-5-11'      { 'Authenticated Users' }
            'S-1-5-12'      { 'Restricted Code' }
            'S-1-5-13'      { 'Terminal Server Users' }
            'S-1-5-14'      { 'Remote Interactive Logon' }
            'S-1-5-15'      { 'This Organization ' }
            'S-1-5-17'      { 'This Organization ' }
            'S-1-5-18'      { 'Local System' }
            'S-1-5-19'      { 'NT Authority' }
            'S-1-5-20'      { 'NT Authority' }
            'S-1-5-80-0'    { 'All Services ' }
            'S-1-5-32-544'  { 'BUILTIN\Administrators' }
            'S-1-5-32-545'  { 'BUILTIN\Users' }
            'S-1-5-32-546'  { 'BUILTIN\Guests' }
            'S-1-5-32-547'  { 'BUILTIN\Power Users' }
            'S-1-5-32-548'  { 'BUILTIN\Account Operators' }
            'S-1-5-32-549'  { 'BUILTIN\Server Operators' }
            'S-1-5-32-550'  { 'BUILTIN\Print Operators' }
            'S-1-5-32-551'  { 'BUILTIN\Backup Operators' }
            'S-1-5-32-552'  { 'BUILTIN\Replicators' }
            'S-1-5-32-554'  { 'BUILTIN\Pre-Windows 2000 Compatible Access' }
            'S-1-5-32-555'  { 'BUILTIN\Remote Desktop Users' }
            'S-1-5-32-556'  { 'BUILTIN\Network Configuration Operators' }
            'S-1-5-32-557'  { 'BUILTIN\Incoming Forest Trust Builders' }
            'S-1-5-32-558'  { 'BUILTIN\Performance Monitor Users' }
            'S-1-5-32-559'  { 'BUILTIN\Performance Log Users' }
            'S-1-5-32-560'  { 'BUILTIN\Windows Authorization Access Group' }
            'S-1-5-32-561'  { 'BUILTIN\Terminal Server License Servers' }
            'S-1-5-32-562'  { 'BUILTIN\Distributed COM Users' }
            'S-1-5-32-569'  { 'BUILTIN\Cryptographic Operators' }
            'S-1-5-32-573'  { 'BUILTIN\Event Log Readers' }
            'S-1-5-32-574'  { 'BUILTIN\Certificate Service DCOM Access' }
            'S-1-5-32-575'  { 'BUILTIN\RDS Remote Access Servers' }
            'S-1-5-32-576'  { 'BUILTIN\RDS Endpoint Servers' }
            'S-1-5-32-577'  { 'BUILTIN\RDS Management Servers' }
            'S-1-5-32-578'  { 'BUILTIN\Hyper-V Administrators' }
            'S-1-5-32-579'  { 'BUILTIN\Access Control Assistance Operators' }
            'S-1-5-32-580'  { 'BUILTIN\Access Control Assistance Operators' }
            Default { 
                $Obj = (New-Object System.Security.Principal.SecurityIdentifier($SID2))
                $Obj.Translate( [System.Security.Principal.NTAccount]).Value
            }
        }
    }
    catch {
        Write-Debug "Invalid SID: $SID"
        $SID
    }
}


filter Convert-ADName {
<#
    .SYNOPSIS

        Converts user/group names from NT4 (DOMAIN\user) or domainSimple (user@domain.com)
        to canonical format (domain.com/Users/user) or NT4.

        Based on Bill Stewart's code from this article: 
            http://windowsitpro.com/active-directory/translating-active-directory-object-names-between-formats

    .PARAMETER ObjectName

        The user/group name to convert.

    .PARAMETER InputType

        The InputType of the user/group name ("NT4","Simple","Canonical").

    .PARAMETER OutputType

        The OutputType of the user/group name ("NT4","Simple","Canonical").

    .EXAMPLE

        PS C:\> Convert-ADName -ObjectName "dev\dfm"
        
        Returns "dev.testlab.local/Users/Dave"

    .EXAMPLE

        PS C:\> Convert-SidToName "S-..." | Convert-ADName
        
        Returns the canonical name for the resolved SID.

    .LINK

        http://windowsitpro.com/active-directory/translating-active-directory-object-names-between-formats
#>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$True, ValueFromPipeline=$True)]
        [String]
        $ObjectName,

        [String]
        [ValidateSet("NT4","Simple","Canonical")]
        $InputType,

        [String]
        [ValidateSet("NT4","Simple","Canonical")]
        $OutputType
    )

    $NameTypes = @{
        "Canonical" = 2
        "NT4"       = 3
        "Simple"    = 5
    }

    if(!$PSBoundParameters['InputType']) {
        if( ($ObjectName.split('/')).Count -eq 2 ) {
            $ObjectName = $ObjectName.replace('/', '\')
        }

        if($ObjectName -match "^[A-Za-z]+\\[A-Za-z ]+$") {
            $InputType = 'NT4'
        }
        elseif($ObjectName -match "^[A-Za-z ]+@[A-Za-z\.]+") {
            $InputType = 'Simple'
        }
        elseif($ObjectName -match "^[A-Za-z\.]+/[A-Za-z]+/[A-Za-z/ ]+") {
            $InputType = 'Canonical'
        }
        else {
            Write-Warning "Can not identify InType for $ObjectName"
            return $ObjectName
        }
    }
    elseif($InputType -eq 'NT4') {
        $ObjectName = $ObjectName.replace('/', '\')
    }

    if(!$PSBoundParameters['OutputType']) {
        $OutputType = Switch($InputType) {
            'NT4' {'Canonical'}
            'Simple' {'NT4'}
            'Canonical' {'NT4'}
        }
    }

    # try to extract the domain from the given format
    $Domain = Switch($InputType) {
        'NT4' { $ObjectName.split("\")[0] }
        'Simple' { $ObjectName.split("@")[1] }
        'Canonical' { $ObjectName.split("/")[0] }
    }

    # Accessor functions to simplify calls to NameTranslate
    function Invoke-Method([__ComObject] $Object, [String] $Method, $Parameters) {
        $Output = $Object.GetType().InvokeMember($Method, "InvokeMethod", $Null, $Object, $Parameters)
        if ( $Output ) { $Output }
    }
    function Set-Property([__ComObject] $Object, [String] $Property, $Parameters) {
        [Void] $Object.GetType().InvokeMember($Property, "SetProperty", $Null, $Object, $Parameters)
    }

    $Translate = New-Object -ComObject NameTranslate

    try {
        Invoke-Method $Translate "Init" (1, $Domain)
    }
    catch [System.Management.Automation.MethodInvocationException] { 
        Write-Debug "Error with translate init in Convert-ADName: $_"
    }

    Set-Property $Translate "ChaseReferral" (0x60)

    try {
        Invoke-Method $Translate "Set" ($NameTypes[$InputType], $ObjectName)
        (Invoke-Method $Translate "Get" ($NameTypes[$OutputType]))
    }
    catch [System.Management.Automation.MethodInvocationException] {
        Write-Debug "Error with translate Set/Get in Convert-ADName: $_"
    }
}


filter Get-NameField {
<#
    .SYNOPSIS
    
        Helper that attempts to extract appropriate field names from
        passed computer objects.

    .PARAMETER Object

        The passed object to extract name fields from.

    .PARAMETER DnsHostName
        
        A DnsHostName to extract through ValueFromPipelineByPropertyName.

    .PARAMETER Name
        
        A Name to extract through ValueFromPipelineByPropertyName.

    .EXAMPLE

        PS C:\> Get-NetComputer -FullData | Get-NameField
#>
    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline = $True, ValueFromPipelineByPropertyName = $True)]
        [Object]
        $Object,

        [Parameter(ValueFromPipelineByPropertyName = $True)]
        [String]
        $DnsHostName,

        [Parameter(ValueFromPipelineByPropertyName = $True)]
        [String]
        $Name
    )

    if($PSBoundParameters['DnsHostName']) {
        $DnsHostName
    }
    elseif($PSBoundParameters['Name']) {
        $Name
    }
    elseif($Object) {
        if ( [bool]($Object.PSobject.Properties.name -match "dnshostname") ) {
            # objects from Get-NetComputer
            $Object.dnshostname
        }
        elseif ( [bool]($Object.PSobject.Properties.name -match "name") ) {
            # objects from Get-NetDomainController
            $Object.name
        }
        else {
            # strings and catch alls
            $Object
        }
    }
    else {
        return $Null
    }
}


function Convert-LDAPProperty {
<#
    .SYNOPSIS
    
        Helper that converts specific LDAP property result fields.
        Used by several of the Get-Net* function.

    .PARAMETER Properties

        Properties object to extract out LDAP fields for display.
#>
    param(
        [Parameter(Mandatory=$True, ValueFromPipeline=$True)]
        [ValidateNotNullOrEmpty()]
        $Properties
    )

    $ObjectProperties = @{}

    $Properties.PropertyNames | ForEach-Object {
        if (($_ -eq "objectsid") -or ($_ -eq "sidhistory")) {
            # convert the SID to a string
            $ObjectProperties[$_] = (New-Object System.Security.Principal.SecurityIdentifier($Properties[$_][0],0)).Value
        }
        elseif($_ -eq "objectguid") {
            # convert the GUID to a string
            $ObjectProperties[$_] = (New-Object Guid (,$Properties[$_][0])).Guid
        }
        elseif( ($_ -eq "lastlogon") -or ($_ -eq "lastlogontimestamp") -or ($_ -eq "pwdlastset") -or ($_ -eq "lastlogoff") -or ($_ -eq "badPasswordTime") ) {
            # convert timestamps
            if ($Properties[$_][0] -is [System.MarshalByRefObject]) {
                # if we have a System.__ComObject
                $Temp = $Properties[$_][0]
                [Int32]$High = $Temp.GetType().InvokeMember("HighPart", [System.Reflection.BindingFlags]::GetProperty, $null, $Temp, $null)
                [Int32]$Low  = $Temp.GetType().InvokeMember("LowPart",  [System.Reflection.BindingFlags]::GetProperty, $null, $Temp, $null)
                $ObjectProperties[$_] = ([datetime]::FromFileTime([Int64]("0x{0:x8}{1:x8}" -f $High, $Low)))
            }
            else {
                $ObjectProperties[$_] = ([datetime]::FromFileTime(($Properties[$_][0])))
            }
        }
        elseif($Properties[$_][0] -is [System.MarshalByRefObject]) {
            # try to convert misc com objects
            $Prop = $Properties[$_]
            try {
                $Temp = $Prop[$_][0]
                Write-Verbose $_
                [Int32]$High = $Temp.GetType().InvokeMember("HighPart", [System.Reflection.BindingFlags]::GetProperty, $null, $Temp, $null)
                [Int32]$Low  = $Temp.GetType().InvokeMember("LowPart",  [System.Reflection.BindingFlags]::GetProperty, $null, $Temp, $null)
                $ObjectProperties[$_] = [Int64]("0x{0:x8}{1:x8}" -f $High, $Low)
            }
            catch {
                $ObjectProperties[$_] = $Prop[$_]
            }
        }
        elseif($Properties[$_].count -eq 1) {
            $ObjectProperties[$_] = $Properties[$_][0]
        }
        else {
            $ObjectProperties[$_] = $Properties[$_]
        }
    }

    New-Object -TypeName PSObject -Property $ObjectProperties
}



########################################################
#
# Domain info functions below.
#
########################################################

filter Get-DomainSearcher {
<#
    .SYNOPSIS

        Helper used by various functions that takes an ADSpath and
        domain specifier and builds the correct ADSI searcher object.

    .PARAMETER Domain

        The domain to use for the query, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through, e.g. "LDAP://OU=secret,DC=testlab,DC=local"
        Useful for OU queries.

    .PARAMETER ADSprefix

        Prefix to set for the searcher (like "CN=Sites,CN=Configuration")

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-DomainSearcher -Domain testlab.local

    .EXAMPLE

        PS C:\> Get-DomainSearcher -Domain testlab.local -DomainController SECONDARY.dev.testlab.local
#>

    param(
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

        [String]
        $ADSprefix,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    if(!$Credential) {
        if(!$Domain){
            $Domain = (Get-NetDomain).name
        }
        elseif(!$DomainController) {
            try {
                # if there's no -DomainController specified, try to pull the primary DC
                #   to reflect queries through
                $DomainController = ((Get-NetDomain).PdcRoleOwner).Name
            }
            catch {
                throw "Get-DomainSearcher: Error in retrieving PDC for current domain"
            }
        }
    }
    elseif (!$DomainController) {
        try {
            $DomainController = ((Get-NetDomain -Credential $Credential).PdcRoleOwner).Name
        }
        catch {
            throw "Get-DomainSearcher: Error in retrieving PDC for current domain"
        }

        if(!$DomainController) {
            throw "Get-DomainSearcher: Error in retrieving PDC for current domain"
        }
    }

    $SearchString = "LDAP://"

    if($DomainController) {
        $SearchString += $DomainController
        if($Domain){
            $SearchString += "/"
        }
    }

    if($ADSprefix) {
        $SearchString += $ADSprefix + ","
    }

    if($ADSpath) {
        if($ADSpath -like "GC://*") {
            # if we're searching the global catalog
            $DN = $AdsPath
            $SearchString = ""
        }
        else {
            if($ADSpath -like "LDAP://*") {
                if($ADSpath -match "LDAP://.+/.+") {
                    $SearchString = ""
                }
                else {
                    $ADSpath = $ADSpath.Substring(7)
                }
            }
            $DN = $ADSpath
        }
    }
    else {
        if($Domain -and ($Domain.Trim() -ne "")) {
            $DN = "DC=$($Domain.Replace('.', ',DC='))"
        }
    }

    $SearchString += $DN
    Write-Verbose "Get-DomainSearcher search string: $SearchString"

    if($Credential) {
        Write-Verbose "Using alternate credentials for LDAP connection"
        $DomainObject = New-Object DirectoryServices.DirectoryEntry($SearchString, $Credential.UserName, $Credential.GetNetworkCredential().Password)
        $Searcher = New-Object System.DirectoryServices.DirectorySearcher($DomainObject)
    }
    else {
        $Searcher = New-Object System.DirectoryServices.DirectorySearcher([ADSI]$SearchString)
    }

    $Searcher.PageSize = $PageSize
    $Searcher.CacheResults = $False
    $Searcher
}


filter Get-NetDomain {
<#
    .SYNOPSIS

        Returns a given domain object.

    .PARAMETER Domain

        The domain name to query for, defaults to the current domain.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetDomain -Domain testlab.local

    .EXAMPLE

        PS C:\> "testlab.local" | Get-NetDomain

    .LINK

        http://social.technet.microsoft.com/Forums/scriptcenter/en-US/0c5b3f83-e528-4d49-92a4-dee31f4b481c/finding-the-dn-of-the-the-domain-without-admodule-in-powershell?forum=ITCG
#>

    param(
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $Domain,

        [Management.Automation.PSCredential]
        $Credential
    )

    if($Credential) {
        
        Write-Verbose "Using alternate credentials for Get-NetDomain"

        if(!$Domain) {
            # if no domain is supplied, extract the logon domain from the PSCredential passed
            $Domain = $Credential.GetNetworkCredential().Domain
            Write-Verbose "Extracted domain '$Domain' from -Credential"
        }
   
        $DomainContext = New-Object System.DirectoryServices.ActiveDirectory.DirectoryContext('Domain', $Domain, $Credential.UserName, $Credential.GetNetworkCredential().Password)
        
        try {
            [System.DirectoryServices.ActiveDirectory.Domain]::GetDomain($DomainContext)
        }
        catch {
            Write-Warning "The specified domain does '$Domain' not exist, could not be contacted, there isn't an existing trust, or the specified credentials are invalid."
            $Null
        }
    }
    elseif($Domain) {
        $DomainContext = New-Object System.DirectoryServices.ActiveDirectory.DirectoryContext('Domain', $Domain)
        try {
            [System.DirectoryServices.ActiveDirectory.Domain]::GetDomain($DomainContext)
        }
        catch {
            Write-Warning "The specified domain '$Domain' does not exist, could not be contacted, or there isn't an existing trust."
            $Null
        }
    }
    else {
        [System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
    }
}


filter Get-NetForest {
<#
    .SYNOPSIS

        Returns a given forest object.

    .PARAMETER Forest

        The forest name to query for, defaults to the current domain.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE
    
        PS C:\> Get-NetForest -Forest external.domain

    .EXAMPLE
    
        PS C:\> "external.domain" | Get-NetForest
#>

    param(
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $Forest,

        [Management.Automation.PSCredential]
        $Credential
    )

    if($Credential) {
        
        Write-Verbose "Using alternate credentials for Get-NetForest"

        if(!$Forest) {
            # if no domain is supplied, extract the logon domain from the PSCredential passed
            $Forest = $Credential.GetNetworkCredential().Domain
            Write-Verbose "Extracted domain '$Forest' from -Credential"
        }
   
        $ForestContext = New-Object System.DirectoryServices.ActiveDirectory.DirectoryContext('Forest', $Forest, $Credential.UserName, $Credential.GetNetworkCredential().Password)
        
        try {
            $ForestObject = [System.DirectoryServices.ActiveDirectory.Forest]::GetForest($ForestContext)
        }
        catch {
            Write-Warning "The specified forest '$Forest' does not exist, could not be contacted, there isn't an existing trust, or the specified credentials are invalid."
            $Null
        }
    }
    elseif($Forest) {
        $ForestContext = New-Object System.DirectoryServices.ActiveDirectory.DirectoryContext('Forest', $Forest)
        try {
            $ForestObject = [System.DirectoryServices.ActiveDirectory.Forest]::GetForest($ForestContext)
        }
        catch {
            Write-Warning "The specified forest '$Forest' does not exist, could not be contacted, or there isn't an existing trust."
            return $Null
        }
    }
    else {
        # otherwise use the current forest
        $ForestObject = [System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest()
    }

    if($ForestObject) {
        # get the SID of the forest root
        $ForestSid = (New-Object System.Security.Principal.NTAccount($ForestObject.RootDomain,"krbtgt")).Translate([System.Security.Principal.SecurityIdentifier]).Value
        $Parts = $ForestSid -Split "-"
        $ForestSid = $Parts[0..$($Parts.length-2)] -join "-"
        $ForestObject | Add-Member NoteProperty 'RootDomainSid' $ForestSid
        $ForestObject
    }
}


filter Get-NetForestDomain {
<#
    .SYNOPSIS

        Return all domains for a given forest.

    .PARAMETER Forest

        The forest name to query domain for.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetForestDomain

    .EXAMPLE

        PS C:\> Get-NetForestDomain -Forest external.local
#>

    param(
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $Forest,

        [Management.Automation.PSCredential]
        $Credential
    )

    $ForestObject = Get-NetForest -Forest $Forest -Credential $Credential

    if($ForestObject) {
        $ForestObject.Domains
    }
}


filter Get-NetForestCatalog {
<#
    .SYNOPSIS

        Return all global catalogs for a given forest.

    .PARAMETER Forest

        The forest name to query domain for.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetForestCatalog
#>
    
    param(
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $Forest,

        [Management.Automation.PSCredential]
        $Credential
    )

    $ForestObject = Get-NetForest -Forest $Forest -Credential $Credential

    if($ForestObject) {
        $ForestObject.FindAllGlobalCatalogs()
    }
}


filter Get-NetDomainController {
<#
    .SYNOPSIS

        Return the current domain controllers for the active domain.

    .PARAMETER Domain

        The domain to query for domain controllers, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER LDAP

        Switch. Use LDAP queries to determine the domain controllers.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetDomainController -Domain 'test.local'
        
        Determine the domain controllers for 'test.local'.

    .EXAMPLE

        PS C:\> Get-NetDomainController -Domain 'test.local' -LDAP

        Determine the domain controllers for 'test.local' using LDAP queries.

    .EXAMPLE

        PS C:\> 'test.local' | Get-NetDomainController

        Determine the domain controllers for 'test.local'.
#>

    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $Domain,

        [String]
        $DomainController,

        [Switch]
        $LDAP,

        [Management.Automation.PSCredential]
        $Credential
    )

    if($LDAP -or $DomainController) {
        # filter string to return all domain controllers
        Get-NetComputer -Domain $Domain -DomainController $DomainController -Credential $Credential -FullData -Filter '(userAccountControl:1.2.840.113556.1.4.803:=8192)'
    }
    else {
        $FoundDomain = Get-NetDomain -Domain $Domain -Credential $Credential
        if($FoundDomain) {
            $Founddomain.DomainControllers
        }
    }
}


########################################################
#
# "net *" replacements and other fun start below
#
########################################################

function Get-NetUser {
<#
    .SYNOPSIS

        Query information for a given user or users in the domain
        using ADSI and LDAP. Another -Domain can be specified to
        query for users across a trust.
        Replacement for "net users /domain"

    .PARAMETER UserName

        Username filter string, wildcards accepted.

    .PARAMETER Domain

        The domain to query for users, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through, e.g. "LDAP://OU=secret,DC=testlab,DC=local"
        Useful for OU queries.

    .PARAMETER Filter

        A customized ldap filter string to use, e.g. "(description=*admin*)"

    .PARAMETER AdminCount

        Switch. Return users with adminCount=1.

    .PARAMETER SPN

        Switch. Only return user objects with non-null service principal names.

    .PARAMETER Unconstrained

        Switch. Return users that have unconstrained delegation.

    .PARAMETER AllowDelegation

        Switch. Return user accounts that are not marked as 'sensitive and not allowed for delegation'

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetUser -Domain testing

    .EXAMPLE

        PS C:\> Get-NetUser -ADSpath "LDAP://OU=secret,DC=testlab,DC=local"
#>

    param(
        [Parameter(Position=0, ValueFromPipeline=$True)]
        [String]
        $UserName,

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

        [String]
        $Filter,

        [Switch]
        $SPN,

        [Switch]
        $AdminCount,

        [Switch]
        $Unconstrained,

        [Switch]
        $AllowDelegation,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    begin {
        # so this isn't repeated if users are passed on the pipeline
        $UserSearcher = Get-DomainSearcher -Domain $Domain -ADSpath $ADSpath -DomainController $DomainController -PageSize $PageSize -Credential $Credential
    }

    process {
        if($UserSearcher) {

            # if we're checking for unconstrained delegation
            if($Unconstrained) {
                Write-Verbose "Checking for unconstrained delegation"
                $Filter += "(userAccountControl:1.2.840.113556.1.4.803:=524288)"
            }
            if($AllowDelegation) {
                Write-Verbose "Checking for users who can be delegated"
                # negation of "Accounts that are sensitive and not trusted for delegation"
                $Filter += "(!(userAccountControl:1.2.840.113556.1.4.803:=1048574))"
            }
            if($AdminCount) {
                Write-Verbose "Checking for adminCount=1"
                $Filter += "(admincount=1)"
            }

            # check if we're using a username filter or not
            if($UserName) {
                # samAccountType=805306368 indicates user objects
                $UserSearcher.filter="(&(samAccountType=805306368)(samAccountName=$UserName)$Filter)"
            }
            elseif($SPN) {
                $UserSearcher.filter="(&(samAccountType=805306368)(servicePrincipalName=*)$Filter)"
            }
            else {
                # filter is something like "(samAccountName=*blah*)" if specified
                $UserSearcher.filter="(&(samAccountType=805306368)$Filter)"
            }

            $Results = $UserSearcher.FindAll()
            $Results | Where-Object {$_} | ForEach-Object {
                # convert/process the LDAP fields for each result
                $User = Convert-LDAPProperty -Properties $_.Properties
                $User.PSObject.TypeNames.Add('PowerView.User')
                $User
            }
            $Results.dispose()
            $UserSearcher.dispose()
        }
    }
}


function Get-ObjectAcl {
<#
    .SYNOPSIS
        Returns the ACLs associated with a specific active directory object.

        Thanks Sean Metcalf (@pyrotek3) for the idea and guidance.

    .PARAMETER SamAccountName

        Object name to filter for.        

    .PARAMETER Name

        Object name to filter for.

    .PARAMETER DistinguishedName

        Object distinguished name to filter for.

    .PARAMETER ResolveGUIDs

        Switch. Resolve GUIDs to their display names.

    .PARAMETER Filter

        A customized ldap filter string to use, e.g. "(description=*admin*)"
     
    .PARAMETER ADSpath

        The LDAP source to search through, e.g. "LDAP://OU=secret,DC=testlab,DC=local"
        Useful for OU queries.

    .PARAMETER ADSprefix

        Prefix to set for the searcher (like "CN=Sites,CN=Configuration")

    .PARAMETER RightsFilter

        Only return results with the associated rights, "All", "ResetPassword","WriteMembers"

    .PARAMETER Domain

        The domain to use for the query, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .EXAMPLE

        PS C:\> Get-ObjectAcl -SamAccountName matt.admin -domain testlab.local
        
        Get the ACLs for the matt.admin user in the testlab.local domain

    .EXAMPLE

        PS C:\> Get-ObjectAcl -SamAccountName matt.admin -domain testlab.local -ResolveGUIDs
        
        Get the ACLs for the matt.admin user in the testlab.local domain and
        resolve relevant GUIDs to their display names.

    .EXAMPLE

        PS C:\> Get-NetOU -FullData | Get-ObjectAcl -ResolveGUIDs

        Enumerate the ACL permissions for all OUs in the domain.
#>

    [CmdletBinding()]
    Param (
        [Parameter(ValueFromPipelineByPropertyName=$True)]
        [String]
        $SamAccountName,

        [Parameter(ValueFromPipelineByPropertyName=$True)]
        [String]
        $Name = "*",

        [Parameter(ValueFromPipelineByPropertyName=$True)]
        [String]
        $DistinguishedName = "*",

        [Switch]
        $ResolveGUIDs,

        [String]
        $Filter,

        [String]
        $ADSpath,

        [String]
        $ADSprefix,

        [String]
        [ValidateSet("All","ResetPassword","WriteMembers")]
        $RightsFilter,

        [String]
        $Domain,

        [String]
        $DomainController,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200
    )

    begin {
        $Searcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -ADSpath $ADSpath -ADSprefix $ADSprefix -PageSize $PageSize 

        # get a GUID -> name mapping
        if($ResolveGUIDs) {
            $GUIDs = Get-GUIDMap -Domain $Domain -DomainController $DomainController -PageSize $PageSize
        }
    }

    process {

        if ($Searcher) {

            if($SamAccountName) {
                $Searcher.filter="(&(samaccountname=$SamAccountName)(name=$Name)(distinguishedname=$DistinguishedName)$Filter)"  
            }
            else {
                $Searcher.filter="(&(name=$Name)(distinguishedname=$DistinguishedName)$Filter)"  
            }
  
            try {
                $Results = $Searcher.FindAll()
                $Results | Where-Object {$_} | ForEach-Object {
                    $Object = [adsi]($_.path)

                    if($Object.distinguishedname) {
                        $Access = $Object.PsBase.ObjectSecurity.access
                        $Access | ForEach-Object {
                            $_ | Add-Member NoteProperty 'ObjectDN' $Object.distinguishedname[0]

                            if($Object.objectsid[0]){
                                $S = (New-Object System.Security.Principal.SecurityIdentifier($Object.objectsid[0],0)).Value
                            }
                            else {
                                $S = $Null
                            }
                            
                            $_ | Add-Member NoteProperty 'ObjectSID' $S
                            $_
                        }
                    }
                } | ForEach-Object {
                    if($RightsFilter) {
                        $GuidFilter = Switch ($RightsFilter) {
                            "ResetPassword" { "00299570-246d-11d0-a768-00aa006e0529" }
                            "WriteMembers" { "bf9679c0-0de6-11d0-a285-00aa003049e2" }
                            Default { "00000000-0000-0000-0000-000000000000"}
                        }
                        if($_.ObjectType -eq $GuidFilter) { $_ }
                    }
                    else {
                        $_
                    }
                } | ForEach-Object {
                    if($GUIDs) {
                        # if we're resolving GUIDs, map them them to the resolved hash table
                        $AclProperties = @{}
                        $_.psobject.properties | ForEach-Object {
                            if( ($_.Name -eq 'ObjectType') -or ($_.Name -eq 'InheritedObjectType') ) {
                                try {
                                    $AclProperties[$_.Name] = $GUIDS[$_.Value.toString()]
                                }
                                catch {
                                    $AclProperties[$_.Name] = $_.Value
                                }
                            }
                            else {
                                $AclProperties[$_.Name] = $_.Value
                            }
                        }
                        New-Object -TypeName PSObject -Property $AclProperties
                    }
                    else { $_ }
                }
                $Results.dispose()
                $Searcher.dispose()
            }
            catch {
                Write-Warning $_
            }
        }
    }
}


filter Get-GUIDMap {
<#
    .SYNOPSIS

        Helper to build a hash table of [GUID] -> resolved names

        Heavily adapted from http://blogs.technet.com/b/ashleymcglone/archive/2013/03/25/active-directory-ou-permissions-report-free-powershell-script-download.aspx

    .PARAMETER Domain
    
        The domain to use for the query, defaults to the current domain.

    .PARAMETER DomainController
    
        Domain controller to reflect LDAP queries through.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .LINK

        http://blogs.technet.com/b/ashleymcglone/archive/2013/03/25/active-directory-ou-permissions-report-free-powershell-script-download.aspx
#>

    [CmdletBinding()]
    Param (
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $Domain,

        [String]
        $DomainController,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200
    )

    $GUIDs = @{'00000000-0000-0000-0000-000000000000' = 'All'}

    $SchemaPath = (Get-NetForest).schema.name

    $SchemaSearcher = Get-DomainSearcher -ADSpath $SchemaPath -DomainController $DomainController -PageSize $PageSize
    if($SchemaSearcher) {
        $SchemaSearcher.filter = "(schemaIDGUID=*)"
        try {
            $Results = $SchemaSearcher.FindAll()
            $Results | Where-Object {$_} | ForEach-Object {
                # convert the GUID
                $GUIDs[(New-Object Guid (,$_.properties.schemaidguid[0])).Guid] = $_.properties.name[0]
            }
            $Results.dispose()
            $SchemaSearcher.dispose()
        }
        catch {
            Write-Debug "Error in building GUID map: $_"
        }
    }

    $RightsSearcher = Get-DomainSearcher -ADSpath $SchemaPath.replace("Schema","Extended-Rights") -DomainController $DomainController -PageSize $PageSize -Credential $Credential
    if ($RightsSearcher) {
        $RightsSearcher.filter = "(objectClass=controlAccessRight)"
        try {
            $Results = $RightsSearcher.FindAll()
            $Results | Where-Object {$_} | ForEach-Object {
                # convert the GUID
                $GUIDs[$_.properties.rightsguid[0].toString()] = $_.properties.name[0]
            }
            $Results.dispose()
            $RightsSearcher.dispose()
        }
        catch {
            Write-Debug "Error in building GUID map: $_"
        }
    }

    $GUIDs
}


function Get-NetComputer {
<#
    .SYNOPSIS

        This function utilizes adsisearcher to query the current AD context
        for current computer objects. Based off of Carlos Perez's Audit.psm1
        script in Posh-SecMod (link below).

    .PARAMETER ComputerName

        Return computers with a specific name, wildcards accepted.

    .PARAMETER SPN

        Return computers with a specific service principal name, wildcards accepted.

    .PARAMETER OperatingSystem

        Return computers with a specific operating system, wildcards accepted.

    .PARAMETER ServicePack

        Return computers with a specific service pack, wildcards accepted.

    .PARAMETER Filter

        A customized ldap filter string to use, e.g. "(description=*admin*)"

    .PARAMETER Printers

        Switch. Return only printers.

    .PARAMETER Ping

        Switch. Ping each host to ensure it's up before enumerating.

    .PARAMETER FullData

        Switch. Return full computer objects instead of just system names (the default).

    .PARAMETER Domain

        The domain to query for computers, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through, e.g. "LDAP://OU=secret,DC=testlab,DC=local"
        Useful for OU queries.
    
    .PARAMETER SiteName

        The AD Site name to search for computers.

    .PARAMETER Unconstrained

        Switch. Return computer objects that have unconstrained delegation.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetComputer
        
        Returns the current computers in current domain.

    .EXAMPLE

        PS C:\> Get-NetComputer -SPN mssql*
        
        Returns all MS SQL servers on the domain.

    .EXAMPLE

        PS C:\> Get-NetComputer -Domain testing
        
        Returns the current computers in 'testing' domain.

    .EXAMPLE

        PS C:\> Get-NetComputer -Domain testing -FullData
        
        Returns full computer objects in the 'testing' domain.

    .LINK

        https://github.com/darkoperator/Posh-SecMod/blob/master/Audit/Audit.psm1
#>

    [CmdletBinding()]
    Param (
        [Parameter(ValueFromPipeline=$True)]
        [Alias('HostName')]
        [String]
        $ComputerName = '*',

        [String]
        $SPN,

        [String]
        $OperatingSystem,

        [String]
        $ServicePack,

        [String]
        $Filter,

        [Switch]
        $Printers,

        [Switch]
        $Ping,

        [Switch]
        $FullData,

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

        [String]
        $SiteName,

        [Switch]
        $Unconstrained,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    begin {
        # so this isn't repeated if multiple computer names are passed on the pipeline
        $CompSearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -ADSpath $ADSpath -PageSize $PageSize -Credential $Credential
    }

    process {

        if ($CompSearcher) {

            # if we're checking for unconstrained delegation
            if($Unconstrained) {
                Write-Verbose "Searching for computers with for unconstrained delegation"
                $Filter += "(userAccountControl:1.2.840.113556.1.4.803:=524288)"
            }
            # set the filters for the seracher if it exists
            if($Printers) {
                Write-Verbose "Searching for printers"
                # $CompSearcher.filter="(&(objectCategory=printQueue)$Filter)"
                $Filter += "(objectCategory=printQueue)"
            }
            if($SPN) {
                Write-Verbose "Searching for computers with SPN: $SPN"
                $Filter += "(servicePrincipalName=$SPN)"
            }
            if($OperatingSystem) {
                $Filter += "(operatingsystem=$OperatingSystem)"
            }
            if($ServicePack) {
                $Filter += "(operatingsystemservicepack=$ServicePack)"
            }
            if($SiteName) {
                $Filter += "(serverreferencebl=$SiteName)"
            }

            $CompFilter = "(&(sAMAccountType=805306369)(dnshostname=$ComputerName)$Filter)"
            Write-Verbose "Get-NetComputer filter : '$CompFilter'"
            $CompSearcher.filter = $CompFilter

            try {
                $Results = $CompSearcher.FindAll()
                $Results | Where-Object {$_} | ForEach-Object {
                    $Up = $True
                    if($Ping) {
                        # TODO: how can these results be piped to ping for a speedup?
                        $Up = Test-Connection -Count 1 -Quiet -ComputerName $_.properties.dnshostname
                    }
                    if($Up) {
                        # return full data objects
                        if ($FullData) {
                            # convert/process the LDAP fields for each result
                            $Computer = Convert-LDAPProperty -Properties $_.Properties
                            $Computer.PSObject.TypeNames.Add('PowerView.Computer')
                            $Computer
                        }
                        else {
                            # otherwise we're just returning the DNS host name
                            $_.properties.dnshostname
                        }
                    }
                }
                $Results.dispose()
                $CompSearcher.dispose()
            }
            catch {
                Write-Warning "Error: $_"
            }
        }
    }
}


function Get-ADObject {
<#
    .SYNOPSIS

        Takes a domain SID and returns the user, group, or computer object
        associated with it.

    .PARAMETER SID

        The SID of the domain object you're querying for.

    .PARAMETER Name

        The Name of the domain object you're querying for.

    .PARAMETER SamAccountName

        The SamAccountName of the domain object you're querying for. 

    .PARAMETER Domain

        The domain to query for objects, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through, e.g. "LDAP://OU=secret,DC=testlab,DC=local"
        Useful for OU queries.

    .PARAMETER Filter

        Additional LDAP filter string for the query.

    .PARAMETER ReturnRaw

        Switch. Return the raw object instead of translating its properties.
        Used by Set-ADObject to modify object properties.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-ADObject -SID "S-1-5-21-2620891829-2411261497-1773853088-1110"
        
        Get the domain object associated with the specified SID.
        
    .EXAMPLE

        PS C:\> Get-ADObject -ADSpath "CN=AdminSDHolder,CN=System,DC=testlab,DC=local"
        
        Get the AdminSDHolder object for the testlab.local domain.
#>

    [CmdletBinding()]
    Param (
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $SID,

        [String]
        $Name,

        [String]
        $SamAccountName,

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

        [String]
        $Filter,

        [Switch]
        $ReturnRaw,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )
    process {
        if($SID) {
            # if a SID is passed, try to resolve it to a reachable domain name for the searcher
            try {
                $Name = Convert-SidToName $SID
                if($Name) {
                    $Canonical = Convert-ADName -ObjectName $Name -InputType NT4 -OutputType Canonical
                    if($Canonical) {
                        $Domain = $Canonical.split("/")[0]
                    }
                    else {
                        Write-Warning "Error resolving SID '$SID'"
                        return $Null
                    }
                }
            }
            catch {
                Write-Warning "Error resolving SID '$SID' : $_"
                return $Null
            }
        }

        $ObjectSearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize

        if($ObjectSearcher) {
            if($SID) {
                $ObjectSearcher.filter = "(&(objectsid=$SID)$Filter)"
            }
            elseif($Name) {
                $ObjectSearcher.filter = "(&(name=$Name)$Filter)"
            }
            elseif($SamAccountName) {
                $ObjectSearcher.filter = "(&(samAccountName=$SamAccountName)$Filter)"
            }

            $Results = $ObjectSearcher.FindAll()
            $Results | Where-Object {$_} | ForEach-Object {
                if($ReturnRaw) {
                    $_
                }
                else {
                    # convert/process the LDAP fields for each result
                    Convert-LDAPProperty -Properties $_.Properties
                }
            }
            $Results.dispose()
            $ObjectSearcher.dispose()
        }
    }
}


function Get-DomainSID {
<#
    .SYNOPSIS

        Gets the SID for the domain.

    .PARAMETER Domain

        The domain to query, defaults to the current domain.

    .EXAMPLE

        C:\> Get-DomainSID -Domain TEST
        
        Returns SID for the domain 'TEST'
#>

    param(
        [String]
        $Domain
    )

    $FoundDomain = Get-NetDomain -Domain $Domain
    
    if($FoundDomain) {
        # query for the primary domain controller so we can extract the domain SID for filtering
        $PrimaryDC = $FoundDomain.PdcRoleOwner
        $PrimaryDCSID = (Get-NetComputer -Domain $Domain -ComputerName $PrimaryDC -FullData).objectsid
        $Parts = $PrimaryDCSID.split("-")
        $Parts[0..($Parts.length -2)] -join "-"
    }
}


function Get-NetGroup {
<#
    .SYNOPSIS

        Gets a list of all current groups in a domain, or all
        the groups a given user/group object belongs to.

    .PARAMETER GroupName

        The group name to query for, wildcards accepted.

    .PARAMETER SID

        The group SID to query for.

    .PARAMETER UserName

        The user name (or group name) to query for all effective
        groups of.

    .PARAMETER Filter

        A customized ldap filter string to use, e.g. "(description=*admin*)"

    .PARAMETER Domain

        The domain to query for groups, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through, e.g. "LDAP://OU=secret,DC=testlab,DC=local"
        Useful for OU queries.

    .PARAMETER AdminCount

        Switch. Return group with adminCount=1.

    .PARAMETER FullData

        Switch. Return full group objects instead of just object names (the default).

    .PARAMETER RawSids

        Switch. Return raw SIDs when using "Get-NetGroup -UserName X"

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetGroup
        
        Returns the current groups in the domain.

    .EXAMPLE

        PS C:\> Get-NetGroup -GroupName *admin*
        
        Returns all groups with "admin" in their group name.

    .EXAMPLE

        PS C:\> Get-NetGroup -Domain testing -FullData
        
        Returns full group data objects in the 'testing' domain
#>

    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $GroupName = '*',

        [String]
        $SID,

        [String]
        $UserName,

        [String]
        $Filter,

        [String]
        $Domain,
        
        [String]
        $DomainController,
        
        [String]
        $ADSpath,

        [Switch]
        $AdminCount,

        [Switch]
        $FullData,

        [Switch]
        $RawSids,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    begin {
        $GroupSearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize
    }

    process {
        if($GroupSearcher) {

            if($AdminCount) {
                Write-Verbose "Checking for adminCount=1"
                $Filter += "(admincount=1)"
            }

            if ($UserName) {
                # get the raw user object
                $User = Get-ADObject -SamAccountName $UserName -Domain $Domain -DomainController $DomainController -Credential $Credential -ReturnRaw -PageSize $PageSize

                # convert the user to a directory entry
                $UserDirectoryEntry = $User.GetDirectoryEntry()

                # cause the cache to calculate the token groups for the user
                $UserDirectoryEntry.RefreshCache("tokenGroups")

                $UserDirectoryEntry.TokenGroups | ForEach-Object {
                    # convert the token group sid
                    $GroupSid = (New-Object System.Security.Principal.SecurityIdentifier($_,0)).Value
                    
                    # ignore the built in users and default domain user group
                    if(!($GroupSid -match '^S-1-5-32-545|-513$')) {
                        if($FullData) {
                            $Group = Get-ADObject -SID $GroupSid -PageSize $PageSize -Domain $Domain -DomainController $DomainController -Credential $Credential
                            $Group.PSObject.TypeNames.Add('PowerView.Group')
                            $Group
                        }
                        else {
                            if($RawSids) {
                                $GroupSid
                            }
                            else {
                                Convert-SidToName $GroupSid
                            }
                        }
                    }
                }
            }
            else {
                if ($SID) {
                    $GroupSearcher.filter = "(&(objectCategory=group)(objectSID=$SID)$Filter)"
                }
                else {
                    $GroupSearcher.filter = "(&(objectCategory=group)(name=$GroupName)$Filter)"
                }
                
                $Results = $GroupSearcher.FindAll()
                $Results | Where-Object {$_} | ForEach-Object {
                    # if we're returning full data objects
                    if ($FullData) {
                        # convert/process the LDAP fields for each result
                        $Group = Convert-LDAPProperty -Properties $_.Properties
                        $Group.PSObject.TypeNames.Add('PowerView.Group')
                        $Group
                    }
                    else {
                        # otherwise we're just returning the group name
                        $_.properties.samaccountname
                    }
                }
                $Results.dispose()
                $GroupSearcher.dispose()
            }
        }
    }
}


function Get-NetGroupMember {
<#
    .SYNOPSIS

        This function users [ADSI] and LDAP to query the current AD context
        or trusted domain for users in a specified group. If no GroupName is
        specified, it defaults to querying the "Domain Admins" group.
        This is a replacement for "net group 'name' /domain"

    .PARAMETER GroupName

        The group name to query for users.

    .PARAMETER SID

        The Group SID to query for users. If not given, it defaults to 512 "Domain Admins"

    .PARAMETER Filter

        A customized ldap filter string to use, e.g. "(description=*admin*)"

    .PARAMETER Domain

        The domain to query for group users, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through, e.g. "LDAP://OU=secret,DC=testlab,DC=local"
        Useful for OU queries.

    .PARAMETER FullData

        Switch. Returns full data objects instead of just group/users.

    .PARAMETER Recurse

        Switch. If the group member is a group, recursively try to query its members as well.

    .PARAMETER UseMatchingRule

        Switch. Use LDAP_MATCHING_RULE_IN_CHAIN in the LDAP search query when -Recurse is specified.
        Much faster than manual recursion, but doesn't reveal cross-domain groups.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetGroupMember
        
        Returns the usernames that of members of the "Domain Admins" domain group.

    .EXAMPLE

        PS C:\> Get-NetGroupMember -Domain testing -GroupName "Power Users"
        
        Returns the usernames that of members of the "Power Users" group in the 'testing' domain.

    .LINK

        http://www.powershellmagazine.com/2013/05/23/pstip-retrieve-group-membership-of-an-active-directory-group-recursively/
#>

    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $GroupName,

        [String]
        $SID,

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

        [Switch]
        $FullData,

        [Switch]
        $Recurse,

        [Switch]
        $UseMatchingRule,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    begin {
        if($DomainController) {
            $TargetDomainController = $DomainController
        }
        else {
            $TargetDomainController = ((Get-NetDomain -Credential $Credential).PdcRoleOwner).Name
        }

        if($Domain) {
            $TargetDomain = $Domain
        }
        else {
            $TargetDomain = Get-NetDomain -Credential $Credential | Select-Object -ExpandProperty name
        }

        # so this isn't repeated if users are passed on the pipeline
        $GroupSearcher = Get-DomainSearcher -Domain $TargetDomain -DomainController $TargetDomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize
    }

    process {
        if ($GroupSearcher) {
            if ($Recurse -and $UseMatchingRule) {
                # resolve the group to a distinguishedname
                if ($GroupName) {
                    $Group = Get-NetGroup -GroupName $GroupName -Domain $TargetDomain -DomainController $TargetDomainController -Credential $Credential -FullData -PageSize $PageSize
                }
                elseif ($SID) {
                    $Group = Get-NetGroup -SID $SID -Domain $TargetDomain -DomainController $TargetDomainController -Credential $Credential -FullData -PageSize $PageSize
                }
                else {
                    # default to domain admins
                    $SID = (Get-DomainSID -Domain $TargetDomain -Credential $Credential) + "-512"
                    $Group = Get-NetGroup -SID $SID -Domain $TargetDomain -DomainController $TargetDomainController -Credential $Credential -FullData -PageSize $PageSize
                }
                $GroupDN = $Group.distinguishedname
                $GroupFoundName = $Group.name

                if ($GroupDN) {
                    $GroupSearcher.filter = "(&(samAccountType=805306368)(memberof:1.2.840.113556.1.4.1941:=$GroupDN)$Filter)"
                    $GroupSearcher.PropertiesToLoad.AddRange(('distinguishedName','samaccounttype','lastlogon','lastlogontimestamp','dscorepropagationdata','objectsid','whencreated','badpasswordtime','accountexpires','iscriticalsystemobject','name','usnchanged','objectcategory','description','codepage','instancetype','countrycode','distinguishedname','cn','admincount','logonhours','objectclass','logoncount','usncreated','useraccountcontrol','objectguid','primarygroupid','lastlogoff','samaccountname','badpwdcount','whenchanged','memberof','pwdlastset','adspath'))

                    $Members = $GroupSearcher.FindAll()
                    $GroupFoundName = $GroupName
                }
                else {
                    Write-Error "Unable to find Group"
                }
            }
            else {
                if ($GroupName) {
                    $GroupSearcher.filter = "(&(objectCategory=group)(name=$GroupName)$Filter)"
                }
                elseif ($SID) {
                    $GroupSearcher.filter = "(&(objectCategory=group)(objectSID=$SID)$Filter)"
                }
                else {
                    # default to domain admins
                    $SID = (Get-DomainSID -Domain $TargetDomain -Credential $Credential) + "-512"
                    $GroupSearcher.filter = "(&(objectCategory=group)(objectSID=$SID)$Filter)"
                }

                try {
                    $Result = $GroupSearcher.FindOne()
                }
                catch {
                    $Members = @()
                }

                $GroupFoundName = ''

                if ($Result) {
                    $Members = $Result.properties.item("member")

                    if($Members.count -eq 0) {

                        $Finished = $False
                        $Bottom = 0
                        $Top = 0

                        while(!$Finished) {
                            $Top = $Bottom + 1499
                            $MemberRange="member;range=$Bottom-$Top"
                            $Bottom += 1500
                            
                            $GroupSearcher.PropertiesToLoad.Clear()
                            [void]$GroupSearcher.PropertiesToLoad.Add("$MemberRange")
                            [void]$GroupSearcher.PropertiesToLoad.Add("name")
                            try {
                                $Result = $GroupSearcher.FindOne()
                                $RangedProperty = $Result.Properties.PropertyNames -like "member;range=*"
                                $Members += $Result.Properties.item($RangedProperty)
                                $GroupFoundName = $Result.properties.item("name")[0]

                                if ($Members.count -eq 0) { 
                                    $Finished = $True
                                }
                            }
                            catch [System.Management.Automation.MethodInvocationException] {
                                $Finished = $True
                            }
                        }
                    }
                    else {
                        $GroupFoundName = $Result.properties.item("name")[0]
                        $Members += $Result.Properties.item($RangedProperty)
                    }
                }
                $GroupSearcher.dispose()
            }

            $Members | Where-Object {$_} | ForEach-Object {
                # if we're doing the LDAP_MATCHING_RULE_IN_CHAIN recursion
                if ($Recurse -and $UseMatchingRule) {
                    $Properties = $_.Properties
                } 
                else {
                    if($TargetDomainController) {
                        $Result = [adsi]"LDAP://$TargetDomainController/$_"
                    }
                    else {
                        $Result = [adsi]"LDAP://$_"
                    }
                    if($Result){
                        $Properties = $Result.Properties
                    }
                }

                if($Properties) {

                    $IsGroup = @('268435456','268435457','536870912','536870913') -contains $Properties.samaccounttype

                    if ($FullData) {
                        $GroupMember = Convert-LDAPProperty -Properties $Properties
                    }
                    else {
                        $GroupMember = New-Object PSObject
                    }

                    $GroupMember | Add-Member Noteproperty 'GroupDomain' $TargetDomain
                    $GroupMember | Add-Member Noteproperty 'GroupName' $GroupFoundName

                    try {
                        $MemberDN = $Properties.distinguishedname[0]
                        
                        # extract the FQDN from the Distinguished Name
                        $MemberDomain = $MemberDN.subString($MemberDN.IndexOf("DC=")) -replace 'DC=','' -replace ',','.'
                    }
                    catch {
                        $MemberDN = $Null
                        $MemberDomain = $Null
                    }

                    if ($Properties.samaccountname) {
                        # forest users have the samAccountName set
                        $MemberName = $Properties.samaccountname[0]
                    } 
                    else {
                        # external trust users have a SID, so convert it
                        try {
                            $MemberName = Convert-SidToName $Properties.cn[0]
                        }
                        catch {
                            # if there's a problem contacting the domain to resolve the SID
                            $MemberName = $Properties.cn
                        }
                    }
                    
                    if($Properties.objectSid) {
                        $MemberSid = ((New-Object System.Security.Principal.SecurityIdentifier $Properties.objectSid[0],0).Value)
                    }
                    else {
                        $MemberSid = $Null
                    }

                    $GroupMember | Add-Member Noteproperty 'MemberDomain' $MemberDomain
                    $GroupMember | Add-Member Noteproperty 'MemberName' $MemberName
                    $GroupMember | Add-Member Noteproperty 'MemberSid' $MemberSid
                    $GroupMember | Add-Member Noteproperty 'IsGroup' $IsGroup
                    $GroupMember | Add-Member Noteproperty 'MemberDN' $MemberDN
                    $GroupMember.PSObject.TypeNames.Add('PowerView.GroupMember')
                    $GroupMember

                    # if we're doing manual recursion
                    if ($Recurse -and !$UseMatchingRule -and $IsGroup -and $MemberName) {
                        if($FullData) {
                            Get-NetGroupMember -FullData -Domain $MemberDomain -DomainController $TargetDomainController -Credential $Credential -GroupName $MemberName -Recurse -PageSize $PageSize
                        }
                        else {
                            Get-NetGroupMember -Domain $MemberDomain -DomainController $TargetDomainController -Credential $Credential -GroupName $MemberName -Recurse -PageSize $PageSize
                        }
                    }
                }

            }
        }
    }
}


function Get-NetFileServer {
<#
    .SYNOPSIS

        Returns a list of all file servers extracted from user 
        homedirectory, scriptpath, and profilepath fields.

    .PARAMETER Domain

        The domain to query for user file servers, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER TargetUsers

        An array of users to query for file servers.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetFileServer
        
        Returns active file servers.

    .EXAMPLE

        PS C:\> Get-NetFileServer -Domain testing
        
        Returns active file servers for the 'testing' domain.
#>

    [CmdletBinding()]
    param(
        [String]
        $Domain,

        [String]
        $DomainController,

        [String[]]
        $TargetUsers,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    function SplitPath {
        # short internal helper to split UNC server paths
        param([String]$Path)

        if ($Path -and ($Path.split("\\").Count -ge 3)) {
            $Temp = $Path.split("\\")[2]
            if($Temp -and ($Temp -ne '')) {
                $Temp
            }
        }
    }

    Get-NetUser -Domain $Domain -DomainController $DomainController -Credential $Credential -PageSize $PageSize | Where-Object {$_} | Where-Object {
            # filter for any target users
            if($TargetUsers) {
                $TargetUsers -Match $_.samAccountName
            }
            else { $True } 
        } | ForEach-Object {
            # split out every potential file server path
            if($_.homedirectory) {
                SplitPath($_.homedirectory)
            }
            if($_.scriptpath) {
                SplitPath($_.scriptpath)
            }
            if($_.profilepath) {
                SplitPath($_.profilepath)
            }

        } | Where-Object {$_} | Sort-Object -Unique
}


function Get-DFSshare {
<#
    .SYNOPSIS

        Returns a list of all fault-tolerant distributed file
        systems for a given domain.

    .PARAMETER Version

        The version of DFS to query for servers.
        1/v1, 2/v2, or all

    .PARAMETER Domain

        The domain to query for user DFS shares, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through, e.g. "LDAP://OU=secret,DC=testlab,DC=local"
        Useful for OU queries.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-DFSshare

        Returns all distributed file system shares for the current domain.

    .EXAMPLE

        PS C:\> Get-DFSshare -Domain test

        Returns all distributed file system shares for the 'test' domain.
#>

    [CmdletBinding()]
    param(
        [String]
        [ValidateSet("All","V1","1","V2","2")]
        $Version = "All",

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    function Parse-Pkt {
        [CmdletBinding()]
        param(
            [byte[]]
            $Pkt
        )

        $bin = $Pkt
        $blob_version = [bitconverter]::ToUInt32($bin[0..3],0)
        $blob_element_count = [bitconverter]::ToUInt32($bin[4..7],0)
        $offset = 8
        #https://msdn.microsoft.com/en-us/library/cc227147.aspx
        $object_list = @()
        for($i=1; $i -le $blob_element_count; $i++){
               $blob_name_size_start = $offset
               $blob_name_size_end = $offset + 1
               $blob_name_size = [bitconverter]::ToUInt16($bin[$blob_name_size_start..$blob_name_size_end],0)

               $blob_name_start = $blob_name_size_end + 1
               $blob_name_end = $blob_name_start + $blob_name_size - 1
               $blob_name = [System.Text.Encoding]::Unicode.GetString($bin[$blob_name_start..$blob_name_end])

               $blob_data_size_start = $blob_name_end + 1
               $blob_data_size_end = $blob_data_size_start + 3
               $blob_data_size = [bitconverter]::ToUInt32($bin[$blob_data_size_start..$blob_data_size_end],0)

               $blob_data_start = $blob_data_size_end + 1
               $blob_data_end = $blob_data_start + $blob_data_size - 1
               $blob_data = $bin[$blob_data_start..$blob_data_end]
               switch -wildcard ($blob_name) {
                "\siteroot" {  }
                "\domainroot*" {
                    # Parse DFSNamespaceRootOrLinkBlob object. Starts with variable length DFSRootOrLinkIDBlob which we parse first...
                    # DFSRootOrLinkIDBlob
                    $root_or_link_guid_start = 0
                    $root_or_link_guid_end = 15
                    $root_or_link_guid = [byte[]]$blob_data[$root_or_link_guid_start..$root_or_link_guid_end]
                    $guid = New-Object Guid(,$root_or_link_guid) # should match $guid_str
                    $prefix_size_start = $root_or_link_guid_end + 1
                    $prefix_size_end = $prefix_size_start + 1
                    $prefix_size = [bitconverter]::ToUInt16($blob_data[$prefix_size_start..$prefix_size_end],0)
                    $prefix_start = $prefix_size_end + 1
                    $prefix_end = $prefix_start + $prefix_size - 1
                    $prefix = [System.Text.Encoding]::Unicode.GetString($blob_data[$prefix_start..$prefix_end])

                    $short_prefix_size_start = $prefix_end + 1
                    $short_prefix_size_end = $short_prefix_size_start + 1
                    $short_prefix_size = [bitconverter]::ToUInt16($blob_data[$short_prefix_size_start..$short_prefix_size_end],0)
                    $short_prefix_start = $short_prefix_size_end + 1
                    $short_prefix_end = $short_prefix_start + $short_prefix_size - 1
                    $short_prefix = [System.Text.Encoding]::Unicode.GetString($blob_data[$short_prefix_start..$short_prefix_end])

                    $type_start = $short_prefix_end + 1
                    $type_end = $type_start + 3
                    $type = [bitconverter]::ToUInt32($blob_data[$type_start..$type_end],0)

                    $state_start = $type_end + 1
                    $state_end = $state_start + 3
                    $state = [bitconverter]::ToUInt32($blob_data[$state_start..$state_end],0)

                    $comment_size_start = $state_end + 1
                    $comment_size_end = $comment_size_start + 1
                    $comment_size = [bitconverter]::ToUInt16($blob_data[$comment_size_start..$comment_size_end],0)
                    $comment_start = $comment_size_end + 1
                    $comment_end = $comment_start + $comment_size - 1
                    if ($comment_size -gt 0)  {
                        $comment = [System.Text.Encoding]::Unicode.GetString($blob_data[$comment_start..$comment_end])
                    }
                    $prefix_timestamp_start = $comment_end + 1
                    $prefix_timestamp_end = $prefix_timestamp_start + 7
                    # https://msdn.microsoft.com/en-us/library/cc230324.aspx FILETIME
                    $prefix_timestamp = $blob_data[$prefix_timestamp_start..$prefix_timestamp_end] #dword lowDateTime #dword highdatetime
                    $state_timestamp_start = $prefix_timestamp_end + 1
                    $state_timestamp_end = $state_timestamp_start + 7
                    $state_timestamp = $blob_data[$state_timestamp_start..$state_timestamp_end]
                    $comment_timestamp_start = $state_timestamp_end + 1
                    $comment_timestamp_end = $comment_timestamp_start + 7
                    $comment_timestamp = $blob_data[$comment_timestamp_start..$comment_timestamp_end]
                    $version_start = $comment_timestamp_end  + 1
                    $version_end = $version_start + 3
                    $version = [bitconverter]::ToUInt32($blob_data[$version_start..$version_end],0)

                    # Parse rest of DFSNamespaceRootOrLinkBlob here
                    $dfs_targetlist_blob_size_start = $version_end + 1
                    $dfs_targetlist_blob_size_end = $dfs_targetlist_blob_size_start + 3
                    $dfs_targetlist_blob_size = [bitconverter]::ToUInt32($blob_data[$dfs_targetlist_blob_size_start..$dfs_targetlist_blob_size_end],0)

                    $dfs_targetlist_blob_start = $dfs_targetlist_blob_size_end + 1
                    $dfs_targetlist_blob_end = $dfs_targetlist_blob_start + $dfs_targetlist_blob_size - 1
                    $dfs_targetlist_blob = $blob_data[$dfs_targetlist_blob_start..$dfs_targetlist_blob_end]
                    $reserved_blob_size_start = $dfs_targetlist_blob_end + 1
                    $reserved_blob_size_end = $reserved_blob_size_start + 3
                    $reserved_blob_size = [bitconverter]::ToUInt32($blob_data[$reserved_blob_size_start..$reserved_blob_size_end],0)

                    $reserved_blob_start = $reserved_blob_size_end + 1
                    $reserved_blob_end = $reserved_blob_start + $reserved_blob_size - 1
                    $reserved_blob = $blob_data[$reserved_blob_start..$reserved_blob_end]
                    $referral_ttl_start = $reserved_blob_end + 1
                    $referral_ttl_end = $referral_ttl_start + 3
                    $referral_ttl = [bitconverter]::ToUInt32($blob_data[$referral_ttl_start..$referral_ttl_end],0)

                    #Parse DFSTargetListBlob
                    $target_count_start = 0
                    $target_count_end = $target_count_start + 3
                    $target_count = [bitconverter]::ToUInt32($dfs_targetlist_blob[$target_count_start..$target_count_end],0)
                    $t_offset = $target_count_end + 1

                    for($j=1; $j -le $target_count; $j++){
                        $target_entry_size_start = $t_offset
                        $target_entry_size_end = $target_entry_size_start + 3
                        $target_entry_size = [bitconverter]::ToUInt32($dfs_targetlist_blob[$target_entry_size_start..$target_entry_size_end],0)
                        $target_time_stamp_start = $target_entry_size_end + 1
                        $target_time_stamp_end = $target_time_stamp_start + 7
                        # FILETIME again or special if priority rank and priority class 0
                        $target_time_stamp = $dfs_targetlist_blob[$target_time_stamp_start..$target_time_stamp_end]
                        $target_state_start = $target_time_stamp_end + 1
                        $target_state_end = $target_state_start + 3
                        $target_state = [bitconverter]::ToUInt32($dfs_targetlist_blob[$target_state_start..$target_state_end],0)

                        $target_type_start = $target_state_end + 1
                        $target_type_end = $target_type_start + 3
                        $target_type = [bitconverter]::ToUInt32($dfs_targetlist_blob[$target_type_start..$target_type_end],0)

                        $server_name_size_start = $target_type_end + 1
                        $server_name_size_end = $server_name_size_start + 1
                        $server_name_size = [bitconverter]::ToUInt16($dfs_targetlist_blob[$server_name_size_start..$server_name_size_end],0)

                        $server_name_start = $server_name_size_end + 1
                        $server_name_end = $server_name_start + $server_name_size - 1
                        $server_name = [System.Text.Encoding]::Unicode.GetString($dfs_targetlist_blob[$server_name_start..$server_name_end])

                        $share_name_size_start = $server_name_end + 1
                        $share_name_size_end = $share_name_size_start + 1
                        $share_name_size = [bitconverter]::ToUInt16($dfs_targetlist_blob[$share_name_size_start..$share_name_size_end],0)
                        $share_name_start = $share_name_size_end + 1
                        $share_name_end = $share_name_start + $share_name_size - 1
                        $share_name = [System.Text.Encoding]::Unicode.GetString($dfs_targetlist_blob[$share_name_start..$share_name_end])

                        $target_list += "\\$server_name\$share_name"
                        $t_offset = $share_name_end + 1
                    }
                }
            }
            $offset = $blob_data_end + 1
            $dfs_pkt_properties = @{
                'Name' = $blob_name
                'Prefix' = $prefix
                'TargetList' = $target_list
            }
            $object_list += New-Object -TypeName PSObject -Property $dfs_pkt_properties
            $prefix = $null
            $blob_name = $null
            $target_list = $null
        }

        $servers = @()
        $object_list | ForEach-Object {
            if ($_.TargetList) {
                $_.TargetList | ForEach-Object {
                    $servers += $_.split("\")[2]
                }
            }
        }

        $servers
    }

    function Get-DFSshareV1 {
        [CmdletBinding()]
        param(
            [String]
            $Domain,

            [String]
            $DomainController,

            [String]
            $ADSpath,

            [ValidateRange(1,10000)]
            [Int]
            $PageSize = 200,

            [Management.Automation.PSCredential]
            $Credential
        )

        $DFSsearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize

        if($DFSsearcher) {
            $DFSshares = @()
            $DFSsearcher.filter = "(&(objectClass=fTDfs))"

            try {
                $Results = $DFSSearcher.FindAll()
                $Results | Where-Object {$_} | ForEach-Object {
                    $Properties = $_.Properties
                    $RemoteNames = $Properties.remoteservername
                    $Pkt = $Properties.pkt

                    $DFSshares += $RemoteNames | ForEach-Object {
                        try {
                            if ( $_.Contains('\') ) {
                                New-Object -TypeName PSObject -Property @{'Name'=$Properties.name[0];'RemoteServerName'=$_.split("\")[2]}
                            }
                        }
                        catch {
                            Write-Debug "Error in parsing DFS share : $_"
                        }
                    }
                }
                $Results.dispose()
                $DFSSearcher.dispose()

                if($pkt -and $pkt[0]) {
                    Parse-Pkt $pkt[0] | ForEach-Object {
                        # If a folder doesn't have a redirection it will
                        # have a target like
                        # \\null\TestNameSpace\folder\.DFSFolderLink so we
                        # do actually want to match on "null" rather than
                        # $null
                        if ($_ -ne "null") {
                            New-Object -TypeName PSObject -Property @{'Name'=$Properties.name[0];'RemoteServerName'=$_}
                        }
                    }
                }
            }
            catch {
                Write-Warning "Get-DFSshareV1 error : $_"
            }
            $DFSshares | Sort-Object -Property "RemoteServerName"
        }
    }

    function Get-DFSshareV2 {
        [CmdletBinding()]
        param(
            [String]
            $Domain,

            [String]
            $DomainController,

            [String]
            $ADSpath,

            [ValidateRange(1,10000)] 
            [Int]
            $PageSize = 200,

            [Management.Automation.PSCredential]
            $Credential
        )

        $DFSsearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize

        if($DFSsearcher) {
            $DFSshares = @()
            $DFSsearcher.filter = "(&(objectClass=msDFS-Linkv2))"
            $DFSSearcher.PropertiesToLoad.AddRange(('msdfs-linkpathv2','msDFS-TargetListv2'))

            try {
                $Results = $DFSSearcher.FindAll()
                $Results | Where-Object {$_} | ForEach-Object {
                    $Properties = $_.Properties
                    $target_list = $Properties.'msdfs-targetlistv2'[0]
                    $xml = [xml][System.Text.Encoding]::Unicode.GetString($target_list[2..($target_list.Length-1)])
                    $DFSshares += $xml.targets.ChildNodes | ForEach-Object {
                        try {
                            $Target = $_.InnerText
                            if ( $Target.Contains('\') ) {
                                $DFSroot = $Target.split("\")[3]
                                $ShareName = $Properties.'msdfs-linkpathv2'[0]
                                New-Object -TypeName PSObject -Property @{'Name'="$DFSroot$ShareName";'RemoteServerName'=$Target.split("\")[2]}
                            }
                        }
                        catch {
                            Write-Debug "Error in parsing target : $_"
                        }
                    }
                }
                $Results.dispose()
                $DFSSearcher.dispose()
            }
            catch {
                Write-Warning "Get-DFSshareV2 error : $_"
            }
            $DFSshares | Sort-Object -Unique -Property "RemoteServerName"
        }
    }

    $DFSshares = @()

    if ( ($Version -eq "all") -or ($Version.endsWith("1")) ) {
        $DFSshares += Get-DFSshareV1 -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize
    }
    if ( ($Version -eq "all") -or ($Version.endsWith("2")) ) {
        $DFSshares += Get-DFSshareV2 -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize
    }

    $DFSshares | Sort-Object -Property ("RemoteServerName","Name") -Unique
}


########################################################
#
# GPO related functions.
#
########################################################

function Get-GptTmpl {
<#
    .SYNOPSIS

        Helper to parse a GptTmpl.inf policy file path into a custom object.

    .PARAMETER GptTmplPath

        The GptTmpl.inf file path name to parse. 

    .PARAMETER UsePSDrive

        Switch. Mount the target GptTmpl folder path as a temporary PSDrive.

    .EXAMPLE

        PS C:\> Get-GptTmpl -GptTmplPath "\\dev.testlab.local\sysvol\dev.testlab.local\Policies\{31B2F340-016D-11D2-945F-00C04FB984F9}\MACHINE\Microsoft\Windows NT\SecEdit\GptTmpl.inf"

        Parse the default domain policy .inf for dev.testlab.local
#>

    [CmdletBinding()]
    Param (
        [Parameter(Mandatory=$True, ValueFromPipeline=$True)]
        [String]
        $GptTmplPath,

        [Switch]
        $UsePSDrive
    )

    begin {
        if($UsePSDrive) {
            # if we're PSDrives, create a temporary mount point
            $Parts = $GptTmplPath.split('\')
            $FolderPath = $Parts[0..($Parts.length-2)] -join '\'
            $FilePath = $Parts[-1]
            $RandDrive = ("abcdefghijklmnopqrstuvwxyz".ToCharArray() | Get-Random -Count 7) -join ''
            
            Write-Verbose "Mounting path $GptTmplPath using a temp PSDrive at $RandDrive"

            try {
                $Null = New-PSDrive -Name $RandDrive -PSProvider FileSystem -Root $FolderPath  -ErrorAction Stop
            }
            catch {
                Write-Debug "Error mounting path $GptTmplPath : $_"
                return $Null
            }

            # so we can cd/dir the new drive
            $TargetGptTmplPath = $RandDrive + ":\" + $FilePath
        }
        else {
            $TargetGptTmplPath = $GptTmplPath
        }
    }

    process {
        $SectionName = ''
        $SectionsTemp = @{}
        $SectionsFinal = @{}

        try {
            Write-Verbose "Parsing $TargetGptTmplPath"

            Get-Content $TargetGptTmplPath -ErrorAction Stop | ForEach-Object {
                if ($_ -match '\[') {
                    # this signifies that we're starting a new section
                    $SectionName = $_.trim('[]') -replace ' ',''
                }
                elseif($_ -match '=') {
                    $Parts = $_.split('=')
                    $PropertyName = $Parts[0].trim()
                    $PropertyValues = $Parts[1].trim()

                    if($PropertyValues -match ',') {
                        $PropertyValues = $PropertyValues.split(',')
                    }

                    if(!$SectionsTemp[$SectionName]) {
                        $SectionsTemp.Add($SectionName, @{})
                    }

                    # add the parsed property into the relevant Section name
                    $SectionsTemp[$SectionName].Add( $PropertyName, $PropertyValues )
                }
            }

            ForEach ($Section in $SectionsTemp.keys) {
                # transform each nested hash table into a custom object
                $SectionsFinal[$Section] = New-Object PSObject -Property $SectionsTemp[$Section]
            }

            # transform the parent hash table into a custom object
            New-Object PSObject -Property $SectionsFinal
        }
        catch {
            Write-Debug "Error parsing $TargetGptTmplPath : $_"
        }
    }

    end {
        if($UsePSDrive -and $RandDrive) {
            Write-Verbose "Removing temp PSDrive $RandDrive"
            Get-PSDrive -Name $RandDrive -ErrorAction SilentlyContinue | Remove-PSDrive -Force
        }
    }
}


function Get-GroupsXML {
<#
    .SYNOPSIS

        Helper to parse a groups.xml file path into a custom object.

    .PARAMETER GroupsXMLpath

        The groups.xml file path name to parse. 

    .PARAMETER ResolveSids

        Switch. Resolve Sids from a DC policy to object names.

    .PARAMETER UsePSDrive

        Switch. Mount the target groups.xml folder path as a temporary PSDrive.
#>

    [CmdletBinding()]
    Param (
        [Parameter(Mandatory=$True, ValueFromPipeline=$True)]
        [String]
        $GroupsXMLPath,

        [Switch]
        $ResolveSids,

        [Switch]
        $UsePSDrive
    )

    begin {
        if($UsePSDrive) {
            # if we're PSDrives, create a temporary mount point
            $Parts = $GroupsXMLPath.split('\')
            $FolderPath = $Parts[0..($Parts.length-2)] -join '\'
            $FilePath = $Parts[-1]
            $RandDrive = ("abcdefghijklmnopqrstuvwxyz".ToCharArray() | Get-Random -Count 7) -join ''

            Write-Verbose "Mounting path $GroupsXMLPath using a temp PSDrive at $RandDrive"

            try {
                $Null = New-PSDrive -Name $RandDrive -PSProvider FileSystem -Root $FolderPath  -ErrorAction Stop
            }
            catch {
                Write-Debug "Error mounting path $GroupsXMLPath : $_"
                return $Null
            }

            # so we can cd/dir the new drive
            $TargetGroupsXMLPath = $RandDrive + ":\" + $FilePath
        }
        else {
            $TargetGroupsXMLPath = $GroupsXMLPath
        }
    }

    process {

        try {
            [xml] $GroupsXMLcontent = Get-Content $TargetGroupsXMLPath -ErrorAction Stop

            # process all group properties in the XML
            $GroupsXMLcontent | Select-Xml "//Groups" | Select-Object -ExpandProperty node | ForEach-Object {

                $Members = @()
                $MemberOf = @()

                # extract the localgroup sid for memberof
                $LocalSid = $_.Properties.GroupSid
                if(!$LocalSid) {
                    if($_.Properties.groupName -match 'Administrators') {
                        $LocalSid = 'S-1-5-32-544'
                    }
                    elseif($_.Properties.groupName -match 'Remote Desktop') {
                        $LocalSid = 'S-1-5-32-555'
                    }
                    else {
                        $LocalSid = $_.Properties.groupName
                    }
                }
                $MemberOf = @($LocalSid)

                $_.Properties.members | ForEach-Object {
                    # process each member of the above local group
                    $_ | Select-Object -ExpandProperty Member | Where-Object { $_.action -match 'ADD' } | ForEach-Object {

                        if($_.sid) {
                            $Members += $_.sid
                        }
                        else {
                            # just a straight local account name
                            $Members += $_.name
                        }
                    }
                }

                if ($Members -or $Memberof) {
                    # extract out any/all filters...I hate you GPP
                    $Filters = $_.filters | ForEach-Object {
                        $_ | Select-Object -ExpandProperty Filter* | ForEach-Object {
                            New-Object -TypeName PSObject -Property @{'Type' = $_.LocalName;'Value' = $_.name}
                        }
                    }

                    if($ResolveSids) {
                        $Memberof = $Memberof | ForEach-Object {Convert-SidToName $_}
                        $Members = $Members | ForEach-Object {Convert-SidToName $_}
                    }

                    if($Memberof -isnot [system.array]) {$Memberof = @($Memberof)}
                    if($Members -isnot [system.array]) {$Members = @($Members)}

                    $GPOProperties = @{
                        'GPODisplayName' = $GPODisplayName
                        'GPOName' = $GPOName
                        'GPOPath' = $TargetGroupsXMLPath
                        'Filters' = $Filters
                        'MemberOf' = $Memberof
                        'Members' = $Members
                    }

                    New-Object -TypeName PSObject -Property $GPOProperties
                }
            }
        }
        catch {
            Write-Debug "Error parsing $TargetGroupsXMLPath : $_"
        }
    }

    end {
        if($UsePSDrive -and $RandDrive) {
            Write-Verbose "Removing temp PSDrive $RandDrive"
            Get-PSDrive -Name $RandDrive -ErrorAction SilentlyContinue | Remove-PSDrive -Force
        }
    }
}


function Get-NetGPO {
<#
    .SYNOPSIS

        Gets a list of all current GPOs in a domain.

    .PARAMETER GPOname

        The GPO name to query for, wildcards accepted.   

    .PARAMETER DisplayName

        The GPO display name to query for, wildcards accepted.   

    .PARAMETER ComputerName

        Return all GPO objects applied to a given computer (FQDN).

    .PARAMETER Domain

        The domain to query for GPOs, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through
        e.g. "LDAP://cn={8FF59D28-15D7-422A-BCB7-2AE45724125A},cn=policies,cn=system,DC=dev,DC=testlab,DC=local"

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetGPO -Domain testlab.local
        
        Returns the GPOs in the 'testlab.local' domain. 
#>
    [CmdletBinding()]
    Param (
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $GPOname = '*',

        [String]
        $DisplayName,

        [String]
        $ComputerName,

        [String]
        $Domain,

        [String]
        $DomainController,
        
        [String]
        $ADSpath,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    begin {
        $GPOSearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize
    }

    process {
        if ($GPOSearcher) {

            if($ComputerName) {
                $GPONames = @()
                $Computers = Get-NetComputer -ComputerName $ComputerName -Domain $Domain -DomainController $DomainController -FullData -PageSize $PageSize

                if(!$Computers) {
                    throw "Computer $ComputerName in domain '$Domain' not found! Try a fully qualified host name"
                }
                
                # get the given computer's OU
                $ComputerOUs = @()
                ForEach($Computer in $Computers) {
                    # extract all OUs a computer is a part of
                    $DN = $Computer.distinguishedname

                    $ComputerOUs += $DN.split(",") | ForEach-Object {
                        if($_.startswith("OU=")) {
                            $DN.substring($DN.indexof($_))
                        }
                    }
                }
                
                Write-Verbose "ComputerOUs: $ComputerOUs"

                # find all the GPOs linked to the computer's OU
                ForEach($ComputerOU in $ComputerOUs) {
                    $GPONames += Get-NetOU -Domain $Domain -DomainController $DomainController -ADSpath $ComputerOU -FullData -PageSize $PageSize | ForEach-Object { 
                        # get any GPO links
                        write-verbose "blah: $($_.name)"
                        $_.gplink.split("][") | ForEach-Object {
                            if ($_.startswith("LDAP")) {
                                $_.split(";")[0]
                            }
                        }
                    }
                }
                
                Write-Verbose "GPONames: $GPONames"

                # find any GPOs linked to the site for the given computer
                $ComputerSite = (Get-SiteName -ComputerName $ComputerName).SiteName
                if($ComputerSite -and ($ComputerSite -ne 'ERROR')) {
                    $GPONames += Get-NetSite -SiteName $ComputerSite -FullData | ForEach-Object {
                        if($_.gplink) {
                            $_.gplink.split("][") | ForEach-Object {
                                if ($_.startswith("LDAP")) {
                                    $_.split(";")[0]
                                }
                            }
                        }
                    }
                }

                $GPONames | Where-Object{$_ -and ($_ -ne '')} | ForEach-Object {

                    # use the gplink as an ADS path to enumerate all GPOs for the computer
                    $GPOSearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $_ -PageSize $PageSize
                    $GPOSearcher.filter="(&(objectCategory=groupPolicyContainer)(name=$GPOname))"

                    try {
                        $Results = $GPOSearcher.FindAll()
                        $Results | Where-Object {$_} | ForEach-Object {
                            $Out = Convert-LDAPProperty -Properties $_.Properties
                            $Out | Add-Member Noteproperty 'ComputerName' $ComputerName
                            $Out
                        }
                        $Results.dispose()
                        $GPOSearcher.dispose()
                    }
                    catch {
                        Write-Warning $_
                    }
                }
            }

            else {
                if($DisplayName) {
                    $GPOSearcher.filter="(&(objectCategory=groupPolicyContainer)(displayname=$DisplayName))"
                }
                else {
                    $GPOSearcher.filter="(&(objectCategory=groupPolicyContainer)(name=$GPOname))"
                }

                try {
                    $Results = $GPOSearcher.FindAll()
                    $Results | Where-Object {$_} | ForEach-Object {
                        # convert/process the LDAP fields for each result
                        Convert-LDAPProperty -Properties $_.Properties
                    }
                    $Results.dispose()
                    $GPOSearcher.dispose()
                }
                catch {
                    Write-Warning $_
                }
            }
        }
    }
}


function Get-NetGPOGroup {
<#
    .SYNOPSIS

        Returns all GPOs in a domain that set "Restricted Groups"
        or use groups.xml on on target machines.

    .PARAMETER GPOname

        The GPO name to query for, wildcards accepted.   

    .PARAMETER DisplayName

        The GPO display name to query for, wildcards accepted.   

    .PARAMETER ResolveSids

        Switch. Resolve Sids from a DC policy to object names.

    .PARAMETER Domain

        The domain to query for GPOs, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through
        e.g. "LDAP://cn={8FF59D28-15D7-422A-BCB7-2AE45724125A},cn=policies,cn=system,DC=dev,DC=testlab,DC=local"

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER UsePSDrive

        Switch. Mount any found policy files with temporary PSDrives.

    .EXAMPLE

        PS C:\> Get-NetGPOGroup

        Get all GPOs that set local groups on the current domain.
#>

    [CmdletBinding()]
    Param (
        [String]
        $GPOname = '*',

        [String]
        $DisplayName,

        [Switch]
        $ResolveSids,

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

        [Switch]
        $UsePSDrive,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200
    )

    # get every GPO from the specified domain with restricted groups set
    Get-NetGPO -GPOName $GPOname -DisplayName $GPOname -Domain $Domain -DomainController $DomainController -ADSpath $ADSpath -PageSize $PageSize | ForEach-Object {

        $Memberof = $Null
        $Members = $Null
        $GPOdisplayName = $_.displayname
        $GPOname = $_.name
        $GPOPath = $_.gpcfilesyspath

        $ParseArgs =  @{
            'GptTmplPath' = "$GPOPath\MACHINE\Microsoft\Windows NT\SecEdit\GptTmpl.inf"
            'UsePSDrive' = $UsePSDrive
        }

        # parse the GptTmpl.inf 'Restricted Groups' file if it exists
        $Inf = Get-GptTmpl @ParseArgs

        if($Inf.GroupMembership) {

            $Memberof = $Inf.GroupMembership | Get-Member *Memberof | ForEach-Object { $Inf.GroupMembership.($_.name) } | ForEach-Object { $_.trim('*') }
            $Members = $Inf.GroupMembership | Get-Member *Members | ForEach-Object { $Inf.GroupMembership.($_.name) } | ForEach-Object { $_.trim('*') }

            if(!$Members) {
                try {
                    $MembersRaw = $Inf.GroupMembership | Get-Member *Members | Select-Object -ExpandProperty Name
                    $Members = ($MembersRaw -split "__")[0].trim("*")
                }
                catch {
                    $MembersRaw = ''
                }
            }

            if(!$Memberof) {
                try {
                    $MemberofRaw = $Inf.GroupMembership | Get-Member *Memberof | Select-Object -ExpandProperty Name
                    $Memberof = ($MemberofRaw -split "__")[0].trim("*")
                }
                catch {
                    $Memberof = ''
                }
            }

            if($ResolveSids) {
                $Memberof = $Memberof | ForEach-Object { Convert-SidToName $_ }
                $Members = $Members | ForEach-Object { Convert-SidToName $_ }
            }

            if($Memberof -isnot [System.Array]) {$Memberof = @($Memberof)}
            if($Members -isnot [System.Array]) {$Members = @($Members)}

            $GPOProperties = @{
                'GPODisplayName' = $GPODisplayName
                'GPOName' = $GPOName
                'GPOPath' = $GPOPath
                'Filters' = $Null
                'MemberOf' = $Memberof
                'Members' = $Members
            }

            New-Object -TypeName PSObject -Property $GPOProperties
        }

        $ParseArgs =  @{
            'GroupsXMLpath' = "$GPOPath\MACHINE\Preferences\Groups\Groups.xml"
            'ResolveSids' = $ResolveSids
            'UsePSDrive' = $UsePSDrive
        }

        Get-GroupsXML @ParseArgs
    }
}


function Find-GPOLocation {
<#
    .SYNOPSIS

        Takes a user/group name and optional domain, and determines 
        the computers in the domain the user/group has local admin 
        (or RDP) rights to.

        It does this by:
            1.  resolving the user/group to its proper sid
            2.  enumerating all groups the user/group is a current part of 
                and extracting all target SIDs to build a target SID list
            3.  pulling all GPOs that set 'Restricted Groups' by calling
                Get-NetGPOGroup
            4.  matching the target sid list to the queried GPO SID list
                to enumerate all GPO the user is effectively applied with
            5.  enumerating all OUs and sites and applicable GPO GUIs are
                applied to through gplink enumerating
            6.  querying for all computers under the given OUs or sites

    .PARAMETER UserName

        A (single) user name name to query for access.

    .PARAMETER GroupName

        A (single) group name name to query for access. 

    .PARAMETER Domain

        Optional domain the user exists in for querying, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER LocalGroup

        The local group to check access against.
        Can be "Administrators" (S-1-5-32-544), "RDP/Remote Desktop Users" (S-1-5-32-555),
        or a custom local SID. Defaults to local 'Administrators'.

    .PARAMETER UsePSDrive

        Switch. Mount any found policy files with temporary PSDrives.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .EXAMPLE

        PS C:\> Find-GPOLocation -UserName dfm
        
        Find all computers that dfm user has local administrator rights to in 
        the current domain.

    .EXAMPLE

        PS C:\> Find-GPOLocation -UserName dfm -Domain dev.testlab.local
        
        Find all computers that dfm user has local administrator rights to in 
        the dev.testlab.local domain.

    .EXAMPLE

        PS C:\> Find-GPOLocation -UserName jason -LocalGroup RDP
        
        Find all computers that jason has local RDP access rights to in the domain.
#>

    [CmdletBinding()]
    Param (
        [String]
        $UserName,

        [String]
        $GroupName,

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $LocalGroup = 'Administrators',
        
        [Switch]
        $UsePSDrive,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200
    )

    if($UserName) {

        $User = Get-NetUser -UserName $UserName -Domain $Domain -DomainController $DomainController -PageSize $PageSize
        $UserSid = $User.objectsid

        if(!$UserSid) {    
            Throw "User '$UserName' not found!"
        }

        $TargetSid = $UserSid
        $ObjectSamAccountName = $User.samaccountname
        $TargetObjects = $UserSid
    }
    elseif($GroupName) {

        $Group = Get-NetGroup -GroupName $GroupName -Domain $Domain -DomainController $DomainController -FullData -PageSize $PageSize
        $GroupSid = $Group.objectsid

        if(!$GroupSid) {    
            Throw "Group '$GroupName' not found!"
        }

        $TargetSid = $GroupSid
        $ObjectSamAccountName = $Group.samaccountname
        $TargetObjects = $GroupSid
    }
    else {
        $TargetSid = '*'
    }

    if($LocalGroup -like "*Admin*") {
        $LocalSID = 'S-1-5-32-544'
    }
    elseif ( ($LocalGroup -like "*RDP*") -or ($LocalGroup -like "*Remote*") ) {
        $LocalSID = 'S-1-5-32-555'
    }
    elseif ($LocalGroup -like "S-1-5-*") {
        $LocalSID = $LocalGroup
    }
    else {
        throw "LocalGroup must be 'Administrators', 'RDP', or a 'S-1-5-X' type sid."
    }

    Write-Verbose "LocalSid: $LocalSID"
    Write-Verbose "TargetSid: $TargetSid"

    if($TargetSid -ne '*') {
        if($TargetSid -isnot [System.Array]) { $TargetSid = @($TargetSid) }

        # use the tokenGroups approach from Get-NetGroup to get all effective
        #   security SIDs this object is a part of
        $TargetSid += Get-NetGroup -Domain $Domain -DomainController $DomainController -PageSize $PageSize -UserName $ObjectSamAccountName -RawSids

        if($TargetSid -isnot [System.Array]) { [System.Array]$TargetSid = [System.Array]@($TargetSid) }
    }

    Write-Verbose "Effective target sids: $TargetSid"

    $GPOGroupArgs =  @{
        'Domain' = $Domain
        'DomainController' = $DomainController
        'UsePSDrive' = $UsePSDrive
        'PageSize' = $PageSize
    }

    # get all GPO groups, and filter on ones that match our target SID list
    #   and match the target local sid memberof list
    $GPOgroups = Get-NetGPOGroup @GPOGroupArgs | ForEach-Object {
        if ($_.members) {
            $_.members = $_.members | Where-Object {$_} | ForEach-Object {
                if($_ -match '^S-1-.*') {
                    $_
                }
                else {
                    # if there are any plain group names, try to resolve them to sids
                    (Convert-NameToSid -ObjectName $_ -Domain $Domain).SID
                }
            } | Sort-Object -Unique

            # stop PowerShell 2.0's string stupid unboxing
            if($_.members -isnot [System.Array]) { $_.members = @($_.members) }
            if($_.memberof -isnot [System.Array]) { $_.memberof = @($_.memberof) }

            # check if the memberof contains the sid of the local account we're searching for
            Write-Verbose "memberof: $($_.memberof)"
            if ($_.memberof -contains $LocalSid) {
                # check if there's an overlap between the members field and the set of target sids
                #   if $TargetSid = *, then return all results
                if ( ($TargetSid -eq '*') -or ($_.members | Where-Object {$_} | Where-Object { $TargetSid -Contains $_ })) {
                    $_
                }
            }
        }
    }

    $ProcessedGUIDs = @{}

    # process the matches and build the result objects
    $GPOgroups | Where-Object {$_} | ForEach-Object {

        $GPOguid = $_.GPOName
        $GPOMembers = $_.Members

        if(!$TargetObjects) {
            # if the * wildcard was used, set the ObjectDistName as the GPO member sid set
            $TargetObjects = $GPOMembers
        }

        if( -not $ProcessedGUIDs[$GPOguid] ) {
            $GPOname = $_.GPODisplayName
            $Filters = $_.Filters

            # find any OUs that have this GUID applied and then retrieve any computers from the OU
            Get-NetOU -Domain $Domain -DomainController $DomainController -GUID $GPOguid -FullData -PageSize $PageSize | ForEach-Object {

                if($Filters) {
                    # filter for computer name/org unit if a filter is specified
                    #   TODO: handle other filters?
                    $OUComputers = Get-NetComputer -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $_.ADSpath -FullData -PageSize $PageSize | Where-Object {
                        $_.adspath -match ($Filters.Value)
                    } | ForEach-Object { $_.dnshostname }
                }
                else {
                    $OUComputers = Get-NetComputer -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $_.ADSpath -PageSize $PageSize
                }

                ForEach ($TargetSid in $TargetObjects) {

                    $Object = Get-ADObject -SID $TargetSid -Domain $Domain -DomainController $DomainController $_ -PageSize $PageSize

                    $IsGroup = @('268435456','268435457','536870912','536870913') -contains $Object.samaccounttype

                    $GPOLocation = New-Object PSObject
                    $GPOLocation | Add-Member Noteproperty 'ObjectName' $Object.samaccountname
                    $GPOLocation | Add-Member Noteproperty 'ObjectDN' $Object.distinguishedname
                    $GPOLocation | Add-Member Noteproperty 'ObjectSID' $Object.objectsid
                    $GPOLocation | Add-Member Noteproperty 'IsGroup' $IsGroup
                    $GPOLocation | Add-Member Noteproperty 'GPOname' $GPOname
                    $GPOLocation | Add-Member Noteproperty 'GPOguid' $GPOguid
                    $GPOLocation | Add-Member Noteproperty 'ContainerName' $_.distinguishedname
                    $GPOLocation | Add-Member Noteproperty 'Computers' $OUComputers
                    $GPOLocation
                }
            }

            # find any sites that have this GUID applied
            Get-NetSite -Domain $Domain -DomainController $DomainController -GUID $GPOguid -PageSize $PageSize -FullData | ForEach-Object {

                ForEach ($TargetSid in $TargetObjects) {
                    $Object = Get-ADObject -SID $TargetSid -Domain $Domain -DomainController $DomainController $_ -PageSize $PageSize

                    $IsGroup = @('268435456','268435457','536870912','536870913') -contains $Object.samaccounttype

                    $AppliedSite = New-Object PSObject
                    $AppliedSite | Add-Member Noteproperty 'ObjectName' $Object.samaccountname
                    $AppliedSite | Add-Member Noteproperty 'ObjectDN' $Object.distinguishedname
                    $AppliedSite | Add-Member Noteproperty 'ObjectSID' $Object.objectsid
                    $AppliedSite | Add-Member Noteproperty 'IsGroup' $IsGroup
                    $AppliedSite | Add-Member Noteproperty 'GPOname' $GPOname
                    $AppliedSite | Add-Member Noteproperty 'GPOguid' $GPOguid
                    $AppliedSite | Add-Member Noteproperty 'ContainerName' $_.distinguishedname
                    $AppliedSite | Add-Member Noteproperty 'Computers' $_.siteobjectbl
                    $AppliedSite
                }
            }

            # mark off this GPO GUID so we don't process it again if there are dupes
            $ProcessedGUIDs[$GPOguid] = $True
        }
    }
}


########################################################
#
# Functions that enumerate a single host, either through
# WinNT, WMI, remote registry, or API calls 
# (with PSReflect).
#
########################################################

function Get-NetLocalGroup {
<#
    .SYNOPSIS

        Gets a list of all current users in a specified local group,
        or returns the names of all local groups with -ListGroups.

    .PARAMETER ComputerName

        The hostname or IP to query for local group users.

    .PARAMETER ComputerFile

        File of hostnames/IPs to query for local group users.

    .PARAMETER GroupName

        The local group name to query for users. If not given, it defaults to "Administrators"

    .PARAMETER ListGroups

        Switch. List all the local groups instead of their members.
        Old Get-NetLocalGroups functionality.

    .PARAMETER Recurse

        Switch. If the local member member is a domain group, recursively try to resolve its members to get a list of domain users who can access this machine.

    .PARAMETER API

        Switch. Use API calls instead of the WinNT service provider. Less information,
        but the results are faster.

    .EXAMPLE

        PS C:\> Get-NetLocalGroup

        Returns the usernames that of members of localgroup "Administrators" on the local host.

    .EXAMPLE

        PS C:\> Get-NetLocalGroup -ComputerName WINDOWSXP

        Returns all the local administrator accounts for WINDOWSXP

    .EXAMPLE

        PS C:\> Get-NetLocalGroup -ComputerName WINDOWS7 -Recurse 

        Returns all effective local/domain users/groups that can access WINDOWS7 with
        local administrative privileges.

    .EXAMPLE

        PS C:\> Get-NetLocalGroup -ComputerName WINDOWS7 -ListGroups

        Returns all local groups on the WINDOWS7 host.

    .EXAMPLE

        PS C:\> "WINDOWS7", "WINDOWSSP" | Get-NetLocalGroup -API

        Returns all local groups on the the passed hosts using API calls instead of the
        WinNT service provider.

    .LINK

        http://stackoverflow.com/questions/21288220/get-all-local-members-and-groups-displayed-together
        http://msdn.microsoft.com/en-us/library/aa772211(VS.85).aspx
#>

    [CmdletBinding(DefaultParameterSetName = 'WinNT')]
    param(
        [Parameter(ParameterSetName = 'API', Position=0, ValueFromPipeline=$True)]
        [Parameter(ParameterSetName = 'WinNT', Position=0, ValueFromPipeline=$True)]
        [Alias('HostName')]
        [String[]]
        $ComputerName = "$($env:COMPUTERNAME)",

        [Parameter(ParameterSetName = 'WinNT')]
        [Parameter(ParameterSetName = 'API')]
        [ValidateScript({Test-Path -Path $_ })]
        [Alias('HostList')]
        [String]
        $ComputerFile,

        [Parameter(ParameterSetName = 'WinNT')]
        [Parameter(ParameterSetName = 'API')]
        [String]
        $GroupName = 'Administrators',

        [Parameter(ParameterSetName = 'WinNT')]
        [Switch]
        $ListGroups,

        [Parameter(ParameterSetName = 'WinNT')]
        [Switch]
        $Recurse,

        [Parameter(ParameterSetName = 'API')]
        [Switch]
        $API
    )

    process {

        $Servers = @()

        # if we have a host list passed, grab it
        if($ComputerFile) {
            $Servers = Get-Content -Path $ComputerFile
        }
        else {
            # otherwise assume a single host name
            $Servers += $ComputerName | Get-NameField
        }

        # query the specified group using the WINNT provider, and
        # extract fields as appropriate from the results
        ForEach($Server in $Servers) {

            if($API) {
                # if we're using the Netapi32 NetLocalGroupGetMembers API call to
                #   get the local group information

                # arguments for NetLocalGroupGetMembers
                $QueryLevel = 2
                $PtrInfo = [IntPtr]::Zero
                $EntriesRead = 0
                $TotalRead = 0
                $ResumeHandle = 0

                # get the local user information
                $Result = $Netapi32::NetLocalGroupGetMembers($Server, $GroupName, $QueryLevel, [ref]$PtrInfo, -1, [ref]$EntriesRead, [ref]$TotalRead, [ref]$ResumeHandle)

                # Locate the offset of the initial intPtr
                $Offset = $PtrInfo.ToInt64()

                Write-Debug "NetLocalGroupGetMembers result for $Server : $Result"
                $LocalUsers = @()

                # 0 = success
                if (($Result -eq 0) -and ($Offset -gt 0)) {

                    # Work out how mutch to increment the pointer by finding out the size of the structure
                    $Increment = $LOCALGROUP_MEMBERS_INFO_2::GetSize()

                    # parse all the result structures
                    for ($i = 0; ($i -lt $EntriesRead); $i++) {
                        # create a new int ptr at the given offset and cast
                        #   the pointer as our result structure
                        $NewIntPtr = New-Object System.Intptr -ArgumentList $Offset
                        $Info = $NewIntPtr -as $LOCALGROUP_MEMBERS_INFO_2

                        $Offset = $NewIntPtr.ToInt64()
                        $Offset += $Increment

                        $SidString = ""
                        $Result = $Advapi32::ConvertSidToStringSid($Info.lgrmi2_sid, [ref]$SidString)
                        Write-Debug "Result of ConvertSidToStringSid: $Result"

                        if($Result -eq 0) {
                            # error codes - http://msdn.microsoft.com/en-us/library/windows/desktop/ms681382(v=vs.85).aspx
                            $Err = $Kernel32::GetLastError()
                            Write-Error "ConvertSidToStringSid LastError: $Err"
                        }
                        else {
                            $LocalUser = New-Object PSObject
                            $LocalUser | Add-Member Noteproperty 'ComputerName' $Server
                            $LocalUser | Add-Member Noteproperty 'AccountName' $Info.lgrmi2_domainandname
                            $LocalUser | Add-Member Noteproperty 'SID' $SidString

                            $IsGroup = $($Info.lgrmi2_sidusage -eq 'SidTypeGroup')
                            $LocalUser | Add-Member Noteproperty 'IsGroup' $IsGroup
                            # add in our custom object
                            $LocalUser.PSObject.TypeNames.Add('PowerView.LocalUser')

                            $LocalUsers += $LocalUser
                        }
                    }

                    # free up the result buffer
                    $Null = $Netapi32::NetApiBufferFree($PtrInfo)

                    # try to extract out the machine SID by using the -500 account as a reference
                    $MachineSid = $LocalUsers | Where-Object {$_.SID -like '*-500'}
                    $Parts = $MachineSid.SID.Split('-')
                    $MachineSid = $Parts[0..($Parts.Length -2)] -join '-'

                    $LocalUsers | ForEach-Object {
                        if($_.SID -match $MachineSid) {
                            $_ | Add-Member Noteproperty 'IsDomain' $False
                        }
                        else {
                            $_ | Add-Member Noteproperty 'IsDomain' $True
                        }
                    }
                    $LocalUsers
                }
                else
                {
                    switch ($Result) {
                        (5)           {Write-Debug 'The user does not have access to the requested information.'}
                        (124)         {Write-Debug 'The value specified for the level parameter is not valid.'}
                        (87)          {Write-Debug 'The specified parameter is not valid.'}
                        (234)         {Write-Debug 'More entries are available. Specify a large enough buffer to receive all entries.'}
                        (8)           {Write-Debug 'Insufficient memory is available.'}
                        (2312)        {Write-Debug 'A session does not exist with the computer name.'}
                        (2351)        {Write-Debug 'The computer name is not valid.'}
                        (2221)        {Write-Debug 'Username not found.'}
                        (53)          {Write-Debug 'Hostname could not be found'}
                    }
                }
            }

            else {
                # otherwise we're using the WinNT service provider
                try {
                    if($ListGroups) {
                        # if we're listing the group names on a remote server
                        $Computer = [ADSI]"WinNT://$Server,computer"

                        $Computer.psbase.children | Where-Object { $_.psbase.schemaClassName -eq 'group' } | ForEach-Object {
                            $Group = New-Object PSObject
                            $Group | Add-Member Noteproperty 'Server' $Server
                            $Group | Add-Member Noteproperty 'Group' ($_.name[0])
                            $Group | Add-Member Noteproperty 'SID' ((New-Object System.Security.Principal.SecurityIdentifier $_.objectsid[0],0).Value)
                            $Group | Add-Member Noteproperty 'Description' ($_.Description[0])
                            $Group.PSObject.TypeNames.Add('PowerView.LocalGroup')
                            $Group
                        }
                    }
                    else {
                        # otherwise we're listing the group members
                        $Members = @($([ADSI]"WinNT://$Server/$GroupName,group").psbase.Invoke('Members'))

                        $Members | ForEach-Object {

                            $Member = New-Object PSObject
                            $Member | Add-Member Noteproperty 'ComputerName' $Server

                            $AdsPath = ($_.GetType().InvokeMember('Adspath', 'GetProperty', $Null, $_, $Null)).Replace('WinNT://', '')

                            # try to translate the NT4 domain to a FQDN if possible
                            $Name = Convert-ADName -ObjectName $AdsPath -InputType 'NT4' -OutputType 'Canonical'

                            if($Name) {
                                $FQDN = $Name.split("/")[0]
                                $ObjName = $AdsPath.split("/")[-1]
                                $Name = "$FQDN/$ObjName"
                                $IsDomain = $True
                            }
                            else {
                                $Name = $AdsPath
                                $IsDomain = $False
                            }

                            $Member | Add-Member Noteproperty 'AccountName' $Name

                            if($IsDomain) {
                                # translate the binary sid to a string
                                $Member | Add-Member Noteproperty 'SID' ((New-Object System.Security.Principal.SecurityIdentifier($_.GetType().InvokeMember('ObjectSID', 'GetProperty', $Null, $_, $Null),0)).Value)

                                $Member | Add-Member Noteproperty 'Description' ""
                                $Member | Add-Member Noteproperty 'Disabled' $False

                                # check if the member is a group
                                $IsGroup = ($_.GetType().InvokeMember('Class', 'GetProperty', $Null, $_, $Null) -eq 'group')
                                $Member | Add-Member Noteproperty 'IsGroup' $IsGroup
                                $Member | Add-Member Noteproperty 'IsDomain' $IsDomain

                                if($IsGroup) {
                                    $Member | Add-Member Noteproperty 'LastLogin' $Null
                                }
                                else {
                                    try {
                                        $Member | Add-Member Noteproperty 'LastLogin' ( $_.GetType().InvokeMember('LastLogin', 'GetProperty', $Null, $_, $Null))
                                    }
                                    catch {
                                        $Member | Add-Member Noteproperty 'LastLogin' $Null
                                    }
                                }
                                $Member | Add-Member Noteproperty 'PwdLastSet' ""
                                $Member | Add-Member Noteproperty 'PwdExpired' ""
                                $Member | Add-Member Noteproperty 'UserFlags' ""
                            }
                            else {
                                # repull this user object so we can ensure correct information
                                $LocalUser = $([ADSI] "WinNT://$AdsPath")

                                # translate the binary sid to a string
                                $Member | Add-Member Noteproperty 'SID' ((New-Object System.Security.Principal.SecurityIdentifier($LocalUser.objectSid.value,0)).Value)

                                $Member | Add-Member Noteproperty 'Description' ($LocalUser.Description[0])

                                # UAC flags of 0x2 mean the account is disabled
                                $Member | Add-Member Noteproperty 'Disabled' $(($LocalUser.userFlags.value -band 2) -eq 2)

                                # check if the member is a group
                                $Member | Add-Member Noteproperty 'IsGroup' ($LocalUser.SchemaClassName -like 'group')
                                $Member | Add-Member Noteproperty 'IsDomain' $IsDomain

                                if($IsGroup) {
                                    $Member | Add-Member Noteproperty 'LastLogin' ""
                                }
                                else {
                                    try {
                                        $Member | Add-Member Noteproperty 'LastLogin' ( $LocalUser.LastLogin[0])
                                    }
                                    catch {
                                        $Member | Add-Member Noteproperty 'LastLogin' ""
                                    }
                                }

                                $Member | Add-Member Noteproperty 'PwdLastSet' ( (Get-Date).AddSeconds(-$LocalUser.PasswordAge[0]))
                                $Member | Add-Member Noteproperty 'PwdExpired' ( $LocalUser.PasswordExpired[0] -eq '1')
                                $Member | Add-Member Noteproperty 'UserFlags' ( $LocalUser.UserFlags[0] )
                            }
                            $Member.PSObject.TypeNames.Add('PowerView.LocalUser')
                            $Member

                            # if the result is a group domain object and we're recursing,
                            #   try to resolve all the group member results
                            if($Recurse -and $IsDomain -and $IsGroup) {

                                $FQDN = $Name.split("/")[0]
                                $GroupName = $Name.split("/")[1].trim()

                                Get-NetGroupMember -GroupName $GroupName -Domain $FQDN -FullData -Recurse | ForEach-Object {

                                    $Member = New-Object PSObject
                                    $Member | Add-Member Noteproperty 'ComputerName' "$FQDN/$($_.GroupName)"

                                    $MemberDN = $_.distinguishedName
                                    # extract the FQDN from the Distinguished Name
                                    $MemberDomain = $MemberDN.subString($MemberDN.IndexOf("DC=")) -replace 'DC=','' -replace ',','.'

                                    $MemberIsGroup = @('268435456','268435457','536870912','536870913') -contains $_.samaccounttype

                                    if ($_.samAccountName) {
                                        # forest users have the samAccountName set
                                        $MemberName = $_.samAccountName
                                    }
                                    else {
                                        try {
                                            # external trust users have a SID, so convert it
                                            try {
                                                $MemberName = Convert-SidToName $_.cn
                                            }
                                            catch {
                                                # if there's a problem contacting the domain to resolve the SID
                                                $MemberName = $_.cn
                                            }
                                        }
                                        catch {
                                            Write-Debug "Error resolving SID : $_"
                                        }
                                    }

                                    $Member | Add-Member Noteproperty 'AccountName' "$MemberDomain/$MemberName"
                                    $Member | Add-Member Noteproperty 'SID' $_.objectsid
                                    $Member | Add-Member Noteproperty 'Description' $_.description
                                    $Member | Add-Member Noteproperty 'Disabled' $False
                                    $Member | Add-Member Noteproperty 'IsGroup' $MemberIsGroup
                                    $Member | Add-Member Noteproperty 'IsDomain' $True
                                    $Member | Add-Member Noteproperty 'LastLogin' ''
                                    $Member | Add-Member Noteproperty 'PwdLastSet' $_.pwdLastSet
                                    $Member | Add-Member Noteproperty 'PwdExpired' ''
                                    $Member | Add-Member Noteproperty 'UserFlags' $_.userAccountControl
                                    $Member.PSObject.TypeNames.Add('PowerView.LocalUser')
                                    $Member
                                }
                            }
                        }
                    }
                }
                catch {
                    Write-Warning "[!] Error: $_"
                }
            }
        }
    }
}


filter Get-NetLoggedon {
<#
    .SYNOPSIS

        This function will execute the NetWkstaUserEnum Win32API call to query
        a given host for actively logged on users.

    .PARAMETER ComputerName

        The hostname to query for logged on users.

    .OUTPUTS

        WKSTA_USER_INFO_1 structure. A representation of the WKSTA_USER_INFO_1
        result structure which includes the username and domain of logged on users,
        with the ComputerName added.

    .EXAMPLE

        PS C:\> Get-NetLoggedon

        Returns users actively logged onto the local host.

    .EXAMPLE

        PS C:\> Get-NetLoggedon -ComputerName sqlserver

        Returns users actively logged onto the 'sqlserver' host.

    .EXAMPLE

        PS C:\> Get-NetComputer | Get-NetLoggedon

        Returns all logged on userse for all computers in the domain.

    .LINK

        http://www.powershellmagazine.com/2014/09/25/easily-defining-enums-structs-and-win32-functions-in-memory/
#>

    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline=$True)]
        [Alias('HostName')]
        [Object[]]
        [ValidateNotNullOrEmpty()]
        $ComputerName = 'localhost'
    )

    # extract the computer name from whatever object was passed on the pipeline
    $Computer = $ComputerName | Get-NameField

    # Declare the reference variables
    $QueryLevel = 1
    $PtrInfo = [IntPtr]::Zero
    $EntriesRead = 0
    $TotalRead = 0
    $ResumeHandle = 0

    # get logged on user information
    $Result = $Netapi32::NetWkstaUserEnum($Computer, $QueryLevel, [ref]$PtrInfo, -1, [ref]$EntriesRead, [ref]$TotalRead, [ref]$ResumeHandle)

    # Locate the offset of the initial intPtr
    $Offset = $PtrInfo.ToInt64()

    Write-Debug "Get-NetLoggedon result for $Computer : $Result"

    # 0 = success
    if (($Result -eq 0) -and ($Offset -gt 0)) {

        # Work out how mutch to increment the pointer by finding out the size of the structure
        $Increment = $WKSTA_USER_INFO_1::GetSize()

        # parse all the result structures
        for ($i = 0; ($i -lt $EntriesRead); $i++) {
            # create a new int ptr at the given offset and cast
            #   the pointer as our result structure
            $NewIntPtr = New-Object System.Intptr -ArgumentList $Offset
            $Info = $NewIntPtr -as $WKSTA_USER_INFO_1

            # return all the sections of the structure
            $LoggedOn = $Info | Select-Object *
            $LoggedOn | Add-Member Noteproperty 'ComputerName' $Computer
            $Offset = $NewIntPtr.ToInt64()
            $Offset += $Increment
            $LoggedOn
        }

        # free up the result buffer
        $Null = $Netapi32::NetApiBufferFree($PtrInfo)
    }
    else
    {
        switch ($Result) {
            (5)           {Write-Debug 'The user does not have access to the requested information.'}
            (124)         {Write-Debug 'The value specified for the level parameter is not valid.'}
            (87)          {Write-Debug 'The specified parameter is not valid.'}
            (234)         {Write-Debug 'More entries are available. Specify a large enough buffer to receive all entries.'}
            (8)           {Write-Debug 'Insufficient memory is available.'}
            (2312)        {Write-Debug 'A session does not exist with the computer name.'}
            (2351)        {Write-Debug 'The computer name is not valid.'}
            (2221)        {Write-Debug 'Username not found.'}
            (53)          {Write-Debug 'Hostname could not be found'}
        }
    }
}


filter Get-NetSession {
<#
    .SYNOPSIS

        This function will execute the NetSessionEnum Win32API call to query
        a given host for active sessions on the host.
        Heavily adapted from dunedinite's post on stackoverflow (see LINK below)

    .PARAMETER ComputerName

        The ComputerName to query for active sessions.

    .PARAMETER UserName

        The user name to filter for active sessions.

    .OUTPUTS

        SESSION_INFO_10 structure. A representation of the SESSION_INFO_10
        result structure which includes the host and username associated
        with active sessions, with the ComputerName added.

    .EXAMPLE

        PS C:\> Get-NetSession

        Returns active sessions on the local host.

    .EXAMPLE

        PS C:\> Get-NetSession -ComputerName sqlserver

        Returns active sessions on the 'sqlserver' host.

    .EXAMPLE

        PS C:\> Get-NetDomainController | Get-NetSession

        Returns active sessions on all domain controllers.

    .LINK

        http://www.powershellmagazine.com/2014/09/25/easily-defining-enums-structs-and-win32-functions-in-memory/
#>

    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline=$True)]
        [Alias('HostName')]
        [Object[]]
        [ValidateNotNullOrEmpty()]
        $ComputerName = 'localhost',

        [String]
        $UserName = ''
    )

    # extract the computer name from whatever object was passed on the pipeline
    $Computer = $ComputerName | Get-NameField

    # arguments for NetSessionEnum
    $QueryLevel = 10
    $PtrInfo = [IntPtr]::Zero
    $EntriesRead = 0
    $TotalRead = 0
    $ResumeHandle = 0

    # get session information
    $Result = $Netapi32::NetSessionEnum($Computer, '', $UserName, $QueryLevel, [ref]$PtrInfo, -1, [ref]$EntriesRead, [ref]$TotalRead, [ref]$ResumeHandle)

    # Locate the offset of the initial intPtr
    $Offset = $PtrInfo.ToInt64()

    Write-Debug "Get-NetSession result for $Computer : $Result"

    # 0 = success
    if (($Result -eq 0) -and ($Offset -gt 0)) {

        # Work out how mutch to increment the pointer by finding out the size of the structure
        $Increment = $SESSION_INFO_10::GetSize()

        # parse all the result structures
        for ($i = 0; ($i -lt $EntriesRead); $i++) {
            # create a new int ptr at the given offset and cast
            # the pointer as our result structure
            $NewIntPtr = New-Object System.Intptr -ArgumentList $Offset
            $Info = $NewIntPtr -as $SESSION_INFO_10

            # return all the sections of the structure
            $Sessions = $Info | Select-Object *
            $Sessions | Add-Member Noteproperty 'ComputerName' $Computer
            $Offset = $NewIntPtr.ToInt64()
            $Offset += $Increment
            $Sessions
        }
        # free up the result buffer
        $Null = $Netapi32::NetApiBufferFree($PtrInfo)
    }
    else
    {
        switch ($Result) {
            (5)           {Write-Debug 'The user does not have access to the requested information.'}
            (124)         {Write-Debug 'The value specified for the level parameter is not valid.'}
            (87)          {Write-Debug 'The specified parameter is not valid.'}
            (234)         {Write-Debug 'More entries are available. Specify a large enough buffer to receive all entries.'}
            (8)           {Write-Debug 'Insufficient memory is available.'}
            (2312)        {Write-Debug 'A session does not exist with the computer name.'}
            (2351)        {Write-Debug 'The computer name is not valid.'}
            (2221)        {Write-Debug 'Username not found.'}
            (53)          {Write-Debug 'Hostname could not be found'}
        }
    }
}


########################################################
#
# 'Meta'-functions start below
#
########################################################

function Invoke-ThreadedFunction {
    # Helper used by any threaded host enumeration functions
    [CmdletBinding()]
    param(
        [Parameter(Position=0,Mandatory=$True)]
        [String[]]
        $ComputerName,

        [Parameter(Position=1,Mandatory=$True)]
        [System.Management.Automation.ScriptBlock]
        $ScriptBlock,

        [Parameter(Position=2)]
        [Hashtable]
        $ScriptParameters,

        [Int]
        [ValidateRange(1,100)] 
        $Threads = 20,

        [Switch]
        $NoImports
    )

    begin {

        if ($PSBoundParameters['Debug']) {
            $DebugPreference = 'Continue'
        }

        Write-Verbose "[*] Total number of hosts: $($ComputerName.count)"

        # Adapted from:
        #   http://powershell.org/wp/forums/topic/invpke-parallel-need-help-to-clone-the-current-runspace/
        $SessionState = [System.Management.Automation.Runspaces.InitialSessionState]::CreateDefault()
        $SessionState.ApartmentState = [System.Threading.Thread]::CurrentThread.GetApartmentState()

        # import the current session state's variables and functions so the chained PowerView
        #   functionality can be used by the threaded blocks
        if(!$NoImports) {

            # grab all the current variables for this runspace
            $MyVars = Get-Variable -Scope 2

            # these Variables are added by Runspace.Open() Method and produce Stop errors if you add them twice
            $VorbiddenVars = @("?","args","ConsoleFileName","Error","ExecutionContext","false","HOME","Host","input","InputObject","MaximumAliasCount","MaximumDriveCount","MaximumErrorCount","MaximumFunctionCount","MaximumHistoryCount","MaximumVariableCount","MyInvocation","null","PID","PSBoundParameters","PSCommandPath","PSCulture","PSDefaultParameterValues","PSHOME","PSScriptRoot","PSUICulture","PSVersionTable","PWD","ShellId","SynchronizedHash","true")

            # Add Variables from Parent Scope (current runspace) into the InitialSessionState
            ForEach($Var in $MyVars) {
                if($VorbiddenVars -NotContains $Var.Name) {
                $SessionState.Variables.Add((New-Object -TypeName System.Management.Automation.Runspaces.SessionStateVariableEntry -ArgumentList $Var.name,$Var.Value,$Var.description,$Var.options,$Var.attributes))
                }
            }

            # Add Functions from current runspace to the InitialSessionState
            ForEach($Function in (Get-ChildItem Function:)) {
                $SessionState.Commands.Add((New-Object -TypeName System.Management.Automation.Runspaces.SessionStateFunctionEntry -ArgumentList $Function.Name, $Function.Definition))
            }
        }

        # threading adapted from
        # https://github.com/darkoperator/Posh-SecMod/blob/master/Discovery/Discovery.psm1#L407
        #   Thanks Carlos!

        # create a pool of maxThread runspaces
        $Pool = [runspacefactory]::CreateRunspacePool(1, $Threads, $SessionState, $Host)
        $Pool.Open()

        $Jobs = @()
        $PS = @()
        $Wait = @()

        $Counter = 0
    }

    process {

        ForEach ($Computer in $ComputerName) {

            # make sure we get a server name
            if ($Computer -ne '') {
                # Write-Verbose "[*] Enumerating server $Computer ($($Counter+1) of $($ComputerName.count))"

                While ($($Pool.GetAvailableRunspaces()) -le 0) {
                    Start-Sleep -MilliSeconds 500
                }

                # create a "powershell pipeline runner"
                $PS += [powershell]::create()

                $PS[$Counter].runspacepool = $Pool

                # add the script block + arguments
                $Null = $PS[$Counter].AddScript($ScriptBlock).AddParameter('ComputerName', $Computer)
                if($ScriptParameters) {
                    ForEach ($Param in $ScriptParameters.GetEnumerator()) {
                        $Null = $PS[$Counter].AddParameter($Param.Name, $Param.Value)
                    }
                }

                # start job
                $Jobs += $PS[$Counter].BeginInvoke();

                # store wait handles for WaitForAll call
                $Wait += $Jobs[$Counter].AsyncWaitHandle
            }
            $Counter = $Counter + 1
        }
    }

    end {

        Write-Verbose "Waiting for scanning threads to finish..."

        $WaitTimeout = Get-Date

        # set a 60 second timeout for the scanning threads
        while ($($Jobs | Where-Object {$_.IsCompleted -eq $False}).count -gt 0 -or $($($(Get-Date) - $WaitTimeout).totalSeconds) -gt 60) {
                Start-Sleep -MilliSeconds 500
            }

        # end async call
        for ($y = 0; $y -lt $Counter; $y++) {

            try {
                # complete async job
                $PS[$y].EndInvoke($Jobs[$y])

            } catch {
                Write-Warning "error: $_"
            }
            finally {
                $PS[$y].Dispose()
            }
        }
        
        $Pool.Dispose()
        Write-Verbose "All threads completed!"
    }
}


function Invoke-UserHunter {
<#
    .SYNOPSIS

        Finds which machines users of a specified group are logged into.

        Author: @harmj0y
        License: BSD 3-Clause

    .DESCRIPTION

        This function finds the local domain name for a host using Get-NetDomain,
        queries the domain for users of a specified group (default "domain admins")
        with Get-NetGroupMember or reads in a target user list, queries the domain for all
        active machines with Get-NetComputer or reads in a pre-populated host list,
        randomly shuffles the target list, then for each server it gets a list of
        active users with Get-NetSession/Get-NetLoggedon. The found user list is compared
        against the target list, and a status message is displayed for any hits.
        The flag -CheckAccess will check each positive host to see if the current
        user has local admin access to the machine.

    .PARAMETER ComputerName

        Host array to enumerate, passable on the pipeline.

    .PARAMETER ComputerFile

        File of hostnames/IPs to search.

    .PARAMETER ComputerFilter

        Host filter name to query AD for, wildcards accepted.

    .PARAMETER ComputerADSpath

        The LDAP source to search through for hosts, e.g. "LDAP://OU=secret,DC=testlab,DC=local"
        Useful for OU queries.

    .PARAMETER Unconstrained

        Switch. Only enumerate computers that have unconstrained delegation.

    .PARAMETER GroupName

        Group name to query for target users.

    .PARAMETER TargetServer

        Hunt for users who are effective local admins on a target server.

    .PARAMETER UserName

        Specific username to search for.

    .PARAMETER UserFilter

        A customized ldap filter string to use for user enumeration, e.g. "(description=*admin*)"

    .PARAMETER UserADSpath

        The LDAP source to search through for users, e.g. "LDAP://OU=secret,DC=testlab,DC=local"
        Useful for OU queries.

    .PARAMETER UserFile

        File of usernames to search for.

    .PARAMETER AdminCount

        Switch. Hunt for users with adminCount=1.

    .PARAMETER AllowDelegation

        Switch. Return user accounts that are not marked as 'sensitive and not allowed for delegation'

    .PARAMETER StopOnSuccess

        Switch. Stop hunting after finding after finding a target user.

    .PARAMETER NoPing

        Don't ping each host to ensure it's up before enumerating.

    .PARAMETER CheckAccess

        Switch. Check if the current user has local admin access to found machines.

    .PARAMETER Delay

        Delay between enumerating hosts, defaults to 0

    .PARAMETER Jitter

        Jitter for the host delay, defaults to +/- 0.3

    .PARAMETER Domain

        Domain for query for machines, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ShowAll

        Switch. Return all user location results, i.e. Invoke-UserView functionality.

    .PARAMETER SearchForest

        Switch. Search all domains in the forest for target users instead of just
        a single domain.

    .PARAMETER Stealth

        Switch. Only enumerate sessions from connonly used target servers.

    .PARAMETER StealthSource

        The source of target servers to use, 'DFS' (distributed file servers),
        'DC' (domain controllers), 'File' (file servers), or 'All'

    .PARAMETER ForeignUsers

        Switch. Only return results that are not part of searched domain.

    .PARAMETER Threads

        The maximum concurrent threads to execute.

    .EXAMPLE

        PS C:\> Invoke-UserHunter -CheckAccess

        Finds machines on the local domain where domain admins are logged into
        and checks if the current user has local administrator access.

    .EXAMPLE

        PS C:\> Invoke-UserHunter -Domain 'testing'

        Finds machines on the 'testing' domain where domain admins are logged into.

    .EXAMPLE

        PS C:\> Invoke-UserHunter -Threads 20

        Multi-threaded user hunting, replaces Invoke-UserHunterThreaded.

    .EXAMPLE

        PS C:\> Invoke-UserHunter -UserFile users.txt -ComputerFile hosts.txt

        Finds machines in hosts.txt where any members of users.txt are logged in
        or have sessions.

    .EXAMPLE

        PS C:\> Invoke-UserHunter -GroupName "Power Users" -Delay 60

        Find machines on the domain where members of the "Power Users" groups are
        logged into with a 60 second (+/- *.3) randomized delay between
        touching each host.

    .EXAMPLE

        PS C:\> Invoke-UserHunter -TargetServer FILESERVER

        Query FILESERVER for useres who are effective local administrators using
        Get-NetLocalGroup -Recurse, and hunt for that user set on the network.

    .EXAMPLE

        PS C:\> Invoke-UserHunter -SearchForest

        Find all machines in the current forest where domain admins are logged in.

    .EXAMPLE

        PS C:\> Invoke-UserHunter -Stealth

        Executes old Invoke-StealthUserHunter functionality, enumerating commonly
        used servers and checking just sessions for each.

    .LINK
        http://blog.harmj0y.net
#>

    [CmdletBinding()]
    param(
        [Parameter(Position=0,ValueFromPipeline=$True)]
        [Alias('Hosts')]
        [String[]]
        $ComputerName,

        [ValidateScript({Test-Path -Path $_ })]
        [Alias('HostList')]
        [String]
        $ComputerFile,

        [String]
        $ComputerFilter,

        [String]
        $ComputerADSpath,

        [Switch]
        $Unconstrained,

        [String]
        $GroupName = 'Domain Admins',

        [String]
        $TargetServer,

        [String]
        $UserName,

        [String]
        $UserFilter,

        [String]
        $UserADSpath,

        [ValidateScript({Test-Path -Path $_ })]
        [String]
        $UserFile,

        [Switch]
        $AdminCount,

        [Switch]
        $AllowDelegation,

        [Switch]
        $CheckAccess,

        [Switch]
        $StopOnSuccess,

        [Switch]
        $NoPing,

        [UInt32]
        $Delay = 0,

        [Double]
        $Jitter = .3,

        [String]
        $Domain,

        [String]
        $DomainController,

        [Switch]
        $ShowAll,

        [Switch]
        $SearchForest,

        [Switch]
        $Stealth,

        [String]
        [ValidateSet("DFS","DC","File","All")]
        $StealthSource ="All",

        [Switch]
        $ForeignUsers,

        [Int]
        [ValidateRange(1,100)]
        $Threads
    )

    begin {

        if ($PSBoundParameters['Debug']) {
            $DebugPreference = 'Continue'
        }

        # random object for delay
        $RandNo = New-Object System.Random

        Write-Verbose "[*] Running Invoke-UserHunter with delay of $Delay"

        #####################################################
        #
        # First we build the host target set
        #
        #####################################################

        if($ComputerFile) {
            # if we're using a host list, read the targets in and add them to the target list
            $ComputerName = Get-Content -Path $ComputerFile
        }

        if(!$ComputerName) { 
            [Array]$ComputerName = @()

            if($Domain) {
                $TargetDomains = @($Domain)
            }
            elseif($SearchForest) {
                # get ALL the domains in the forest to search
                $TargetDomains = Get-NetForestDomain | ForEach-Object { $_.Name }
            }
            else {
                # use the local domain
                $TargetDomains = @( (Get-NetDomain).name )
            }
            
            if($Stealth) {
                Write-Verbose "Stealth mode! Enumerating commonly used servers"
                Write-Verbose "Stealth source: $StealthSource"

                ForEach ($Domain in $TargetDomains) {
                    if (($StealthSource -eq "File") -or ($StealthSource -eq "All")) {
                        Write-Verbose "[*] Querying domain $Domain for File Servers..."
                        $ComputerName += Get-NetFileServer -Domain $Domain -DomainController $DomainController
                    }
                    if (($StealthSource -eq "DFS") -or ($StealthSource -eq "All")) {
                        Write-Verbose "[*] Querying domain $Domain for DFS Servers..."
                        $ComputerName += Get-DFSshare -Domain $Domain -DomainController $DomainController | ForEach-Object {$_.RemoteServerName}
                    }
                    if (($StealthSource -eq "DC") -or ($StealthSource -eq "All")) {
                        Write-Verbose "[*] Querying domain $Domain for Domain Controllers..."
                        $ComputerName += Get-NetDomainController -LDAP -Domain $Domain -DomainController $DomainController | ForEach-Object { $_.dnshostname}
                    }
                }
            }
            else {
                ForEach ($Domain in $TargetDomains) {
                    Write-Verbose "[*] Querying domain $Domain for hosts"

                    $Arguments = @{
                        'Domain' = $Domain
                        'DomainController' = $DomainController
                        'ADSpath' = $ADSpath
                        'Filter' = $ComputerFilter
                        'Unconstrained' = $Unconstrained
                    }

                    $ComputerName += Get-NetComputer @Arguments
                }
            }

            # remove any null target hosts, uniquify the list and shuffle it
            $ComputerName = $ComputerName | Where-Object { $_ } | Sort-Object -Unique | Sort-Object { Get-Random }
            if($($ComputerName.Count) -eq 0) {
                throw "No hosts found!"
            }
        }

        #####################################################
        #
        # Now we build the user target set
        #
        #####################################################

        # users we're going to be searching for
        $TargetUsers = @()

        # get the current user so we can ignore it in the results
        $CurrentUser = ([Environment]::UserName).toLower()

        # if we're showing all results, skip username enumeration
        if($ShowAll -or $ForeignUsers) {
            $User = New-Object PSObject
            $User | Add-Member Noteproperty 'MemberDomain' $Null
            $User | Add-Member Noteproperty 'MemberName' '*'
            $TargetUsers = @($User)

            if($ForeignUsers) {
                # if we're searching for user results not in the primary domain
                $krbtgtName = Convert-ADName -ObjectName "krbtgt@$($Domain)" -InputType Simple -OutputType NT4
                $DomainShortName = $krbtgtName.split("\")[0]
            }
        }
        # if we want to hunt for the effective domain users who can access a target server
        elseif($TargetServer) {
            Write-Verbose "Querying target server '$TargetServer' for local users"
            $TargetUsers = Get-NetLocalGroup $TargetServer -Recurse | Where-Object {(-not $_.IsGroup) -and $_.IsDomain } | ForEach-Object {
                $User = New-Object PSObject
                $User | Add-Member Noteproperty 'MemberDomain' ($_.AccountName).split("/")[0].toLower() 
                $User | Add-Member Noteproperty 'MemberName' ($_.AccountName).split("/")[1].toLower() 
                $User
            }  | Where-Object {$_}
        }
        # if we get a specific username, only use that
        elseif($UserName) {
            Write-Verbose "[*] Using target user '$UserName'..."
            $User = New-Object PSObject
            if($TargetDomains) {
                $User | Add-Member Noteproperty 'MemberDomain' $TargetDomains[0]
            }
            else {
                $User | Add-Member Noteproperty 'MemberDomain' $Null
            }
            $User | Add-Member Noteproperty 'MemberName' $UserName.ToLower()
            $TargetUsers = @($User)
        }
        # read in a target user list if we have one
        elseif($UserFile) {
            $TargetUsers = Get-Content -Path $UserFile | ForEach-Object {
                $User = New-Object PSObject
                if($TargetDomains) {
                    $User | Add-Member Noteproperty 'MemberDomain' $TargetDomains[0]
                }
                else {
                    $User | Add-Member Noteproperty 'MemberDomain' $Null
                }
                $User | Add-Member Noteproperty 'MemberName' $_
                $User
            }  | Where-Object {$_}
        }
        elseif($UserADSpath -or $UserFilter -or $AdminCount) {
            ForEach ($Domain in $TargetDomains) {

                $Arguments = @{
                    'Domain' = $Domain
                    'DomainController' = $DomainController
                    'ADSpath' = $UserADSpath
                    'Filter' = $UserFilter
                    'AdminCount' = $AdminCount
                    'AllowDelegation' = $AllowDelegation
                }

                Write-Verbose "[*] Querying domain $Domain for users"
                $TargetUsers += Get-NetUser @Arguments | ForEach-Object {
                    $User = New-Object PSObject
                    $User | Add-Member Noteproperty 'MemberDomain' $Domain
                    $User | Add-Member Noteproperty 'MemberName' $_.samaccountname
                    $User
                }  | Where-Object {$_}

            }
        }
        else {
            ForEach ($Domain in $TargetDomains) {
                Write-Verbose "[*] Querying domain $Domain for users of group '$GroupName'"
                $TargetUsers += Get-NetGroupMember -GroupName $GroupName -Domain $Domain -DomainController $DomainController
            }
        }

        if (( (-not $ShowAll) -and (-not $ForeignUsers) ) -and ((!$TargetUsers) -or ($TargetUsers.Count -eq 0))) {
            throw "[!] No users found to search for!"
        }

        # script block that enumerates a server
        $HostEnumBlock = {
            param($ComputerName, $Ping, $TargetUsers, $CurrentUser, $Stealth, $DomainShortName)

            # optionally check if the server is up first
            $Up = $True
            if($Ping) {
                $Up = Test-Connection -Count 1 -Quiet -ComputerName $ComputerName
            }
            if($Up) {
                if(!$DomainShortName) {
                    # if we're not searching for foreign users, check session information
                    $Sessions = Get-NetSession -ComputerName $ComputerName
                    ForEach ($Session in $Sessions) {
                        $UserName = $Session.sesi10_username
                        $CName = $Session.sesi10_cname

                        if($CName -and $CName.StartsWith("\\")) {
                            $CName = $CName.TrimStart("\")
                        }

                        # make sure we have a result
                        if (($UserName) -and ($UserName.trim() -ne '') -and (!($UserName -match $CurrentUser))) {

                            $TargetUsers | Where-Object {$UserName -like $_.MemberName} | ForEach-Object {

                                $IPAddress = @(Get-IPAddress -ComputerName $ComputerName)[0].IPAddress
                                $FoundUser = New-Object PSObject
                                $FoundUser | Add-Member Noteproperty 'UserDomain' $_.MemberDomain
                                $FoundUser | Add-Member Noteproperty 'UserName' $UserName
                                $FoundUser | Add-Member Noteproperty 'ComputerName' $ComputerName
                                $FoundUser | Add-Member Noteproperty 'IPAddress' $IPAddress
                                $FoundUser | Add-Member Noteproperty 'SessionFrom' $CName

                                # Try to resolve the DNS hostname of $Cname
                                try {
                                    $CNameDNSName = [System.Net.Dns]::GetHostEntry($CName) | Select-Object -ExpandProperty HostName
                                }
                                catch {
                                    $CNameDNSName = $CName
                                }
                                $FoundUser | Add-Member NoteProperty 'SessionFromName' $CNameDNSName

                                # see if we're checking to see if we have local admin access on this machine
                                if ($CheckAccess) {
                                    $Admin = Invoke-CheckLocalAdminAccess -ComputerName $CName
                                    $FoundUser | Add-Member Noteproperty 'LocalAdmin' $Admin
                                }
                                else {
                                    $FoundUser | Add-Member Noteproperty 'LocalAdmin' $Null
                                }
                                $FoundUser.PSObject.TypeNames.Add('PowerView.UserSession')
                                $FoundUser
                            }
                        }
                    }
                }
                if(!$Stealth) {
                    # if we're not 'stealthy', enumerate loggedon users as well
                    $LoggedOn = Get-NetLoggedon -ComputerName $ComputerName
                    ForEach ($User in $LoggedOn) {
                        $UserName = $User.wkui1_username
                        # TODO: translate domain to authoratative name
                        #   then match domain name ?
                        $UserDomain = $User.wkui1_logon_domain

                        # make sure wet have a result
                        if (($UserName) -and ($UserName.trim() -ne '')) {

                            $TargetUsers | Where-Object {$UserName -like $_.MemberName} | ForEach-Object {

                                $Proceed = $True
                                if($DomainShortName) {
                                    if ($DomainShortName.ToLower() -ne $UserDomain.ToLower()) {
                                        $Proceed = $True
                                    }
                                    else {
                                        $Proceed = $False
                                    }
                                }
                                if($Proceed) {
                                    $IPAddress = @(Get-IPAddress -ComputerName $ComputerName)[0].IPAddress
                                    $FoundUser = New-Object PSObject
                                    $FoundUser | Add-Member Noteproperty 'UserDomain' $UserDomain
                                    $FoundUser | Add-Member Noteproperty 'UserName' $UserName
                                    $FoundUser | Add-Member Noteproperty 'ComputerName' $ComputerName
                                    $FoundUser | Add-Member Noteproperty 'IPAddress' $IPAddress
                                    $FoundUser | Add-Member Noteproperty 'SessionFrom' $Null
                                    $FoundUser | Add-Member Noteproperty 'SessionFromName' $Null

                                    # see if we're checking to see if we have local admin access on this machine
                                    if ($CheckAccess) {
                                        $Admin = Invoke-CheckLocalAdminAccess -ComputerName $ComputerName
                                        $FoundUser | Add-Member Noteproperty 'LocalAdmin' $Admin
                                    }
                                    else {
                                        $FoundUser | Add-Member Noteproperty 'LocalAdmin' $Null
                                    }
                                    $FoundUser.PSObject.TypeNames.Add('PowerView.UserSession')
                                    $FoundUser
                                }
                            }
                        }
                    }
                }
            }
        }

    }

    process {

        if($Threads) {
            Write-Verbose "Using threading with threads = $Threads"

            # if we're using threading, kick off the script block with Invoke-ThreadedFunction
            $ScriptParams = @{
                'Ping' = $(-not $NoPing)
                'TargetUsers' = $TargetUsers
                'CurrentUser' = $CurrentUser
                'Stealth' = $Stealth
                'DomainShortName' = $DomainShortName
            }

            # kick off the threaded script block + arguments 
            Invoke-ThreadedFunction -ComputerName $ComputerName -ScriptBlock $HostEnumBlock -ScriptParameters $ScriptParams -Threads $Threads
        }

        else {
            if(-not $NoPing -and ($ComputerName.count -ne 1)) {
                # ping all hosts in parallel
                $Ping = {param($ComputerName) if(Test-Connection -ComputerName $ComputerName -Count 1 -Quiet -ErrorAction Stop){$ComputerName}}
                $ComputerName = Invoke-ThreadedFunction -NoImports -ComputerName $ComputerName -ScriptBlock $Ping -Threads 100
            }

            Write-Verbose "[*] Total number of active hosts: $($ComputerName.count)"
            $Counter = 0

            ForEach ($Computer in $ComputerName) {

                $Counter = $Counter + 1

                # sleep for our semi-randomized interval
                Start-Sleep -Seconds $RandNo.Next((1-$Jitter)*$Delay, (1+$Jitter)*$Delay)

                Write-Verbose "[*] Enumerating server $Computer ($Counter of $($ComputerName.count))"
                $Result = Invoke-Command -ScriptBlock $HostEnumBlock -ArgumentList $Computer, $False, $TargetUsers, $CurrentUser, $Stealth, $DomainShortName
                $Result

                if($Result -and $StopOnSuccess) {
                    Write-Verbose "[*] Target user found, returning early"
                    return
                }
            }
        }

    }
}


function Invoke-EnumerateLocalAdmin {
<#
    .SYNOPSIS

        This function queries the domain for all active machines with
        Get-NetComputer, then for each server it queries the local
        Administrators with Get-NetLocalGroup.

        Author: @harmj0y
        License: BSD 3-Clause

    .PARAMETER ComputerName

        Host array to enumerate, passable on the pipeline.

    .PARAMETER ComputerFile

        File of hostnames/IPs to search.

    .PARAMETER ComputerFilter

        Host filter name to query AD for, wildcards accepted.

    .PARAMETER ComputerADSpath

        The LDAP source to search through for hosts, e.g. "LDAP://OU=secret,DC=testlab,DC=local"
        Useful for OU queries.

    .PARAMETER NoPing

        Switch. Don't ping each host to ensure it's up before enumerating.

    .PARAMETER Delay

        Delay between enumerating hosts, defaults to 0

    .PARAMETER Jitter

        Jitter for the host delay, defaults to +/- 0.3

    .PARAMETER OutFile

        Output results to a specified csv output file.

    .PARAMETER NoClobber

        Switch. Don't overwrite any existing output file.

    .PARAMETER TrustGroups

        Switch. Only return results that are not part of the local machine
        or the machine's domain. Old Invoke-EnumerateLocalTrustGroup
        functionality.
    
    .PARAMETER DomainOnly

        Switch. Only return domain (non-local) results  

    .PARAMETER Domain

        Domain to query for machines, defaults to the current domain.
    
    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER SearchForest

        Switch. Search all domains in the forest for target users instead of just
        a single domain.

    .PARAMETER API

        Switch. Use API calls instead of the WinNT service provider. Less information,
        but the results are faster.

    .PARAMETER Threads

        The maximum concurrent threads to execute.

    .EXAMPLE

        PS C:\> Invoke-EnumerateLocalAdmin

        Enumerates the members of local administrators for all machines
        in the current domain.

    .EXAMPLE

        PS C:\> Invoke-EnumerateLocalAdmin -Threads 10

        Threaded local admin enumeration, replaces Invoke-EnumerateLocalAdminThreaded

    .LINK

        http://blog.harmj0y.net/
#>

    [CmdletBinding()]
    param(
        [Parameter(Position=0,ValueFromPipeline=$True)]
        [Alias('Hosts')]
        [String[]]
        $ComputerName,

        [ValidateScript({Test-Path -Path $_ })]
        [Alias('HostList')]
        [String]
        $ComputerFile,

        [String]
        $ComputerFilter,

        [String]
        $ComputerADSpath,

        [Switch]
        $NoPing,

        [UInt32]
        $Delay = 0,

        [Double]
        $Jitter = .3,

        [String]
        $OutFile,

        [Switch]
        $NoClobber,

        [Switch]
        $TrustGroups,

        [Switch]
        $DomainOnly,

        [String]
        $Domain,

        [String]
        $DomainController,

        [Switch]
        $SearchForest,

        [ValidateRange(1,100)] 
        [Int]
        $Threads,

        [Switch]
        $API
    )

    begin {
        if ($PSBoundParameters['Debug']) {
            $DebugPreference = 'Continue'
        }

        # random object for delay
        $RandNo = New-Object System.Random

        Write-Verbose "[*] Running Invoke-EnumerateLocalAdmin with delay of $Delay"

        # if we're using a host list, read the targets in and add them to the target list
        if($ComputerFile) {
            $ComputerName = Get-Content -Path $ComputerFile
        }

        if(!$ComputerName) { 
            [array]$ComputerName = @()

            if($Domain) {
                $TargetDomains = @($Domain)
            }
            elseif($SearchForest) {
                # get ALL the domains in the forest to search
                $TargetDomains = Get-NetForestDomain | ForEach-Object { $_.Name }
            }
            else {
                # use the local domain
                $TargetDomains = @( (Get-NetDomain).name )
            }

            ForEach ($Domain in $TargetDomains) {
                Write-Verbose "[*] Querying domain $Domain for hosts"
                $ComputerName += Get-NetComputer -Filter $ComputerFilter -ADSpath $ComputerADSpath -Domain $Domain -DomainController $DomainController
            }
            
            # remove any null target hosts, uniquify the list and shuffle it
            $ComputerName = $ComputerName | Where-Object { $_ } | Sort-Object -Unique | Sort-Object { Get-Random }
            if($($ComputerName.Count) -eq 0) {
                throw "No hosts found!"
            }
        }

        # delete any existing output file if it already exists
        if(!$NoClobber) {
            if ($OutFile -and (Test-Path -Path $OutFile)) { Remove-Item -Path $OutFile }
        }

        if($TrustGroups) {
            
            Write-Verbose "Determining domain trust groups"

            # find all group names that have one or more users in another domain
            $TrustGroupNames = Find-ForeignGroup -Domain $Domain -DomainController $DomainController | ForEach-Object { $_.GroupName } | Sort-Object -Unique

            $TrustGroupsSIDs = $TrustGroupNames | ForEach-Object { 
                # ignore the builtin administrators group for a DC (S-1-5-32-544)
                # TODO: ignore all default built in sids?
                Get-NetGroup -Domain $Domain -DomainController $DomainController -GroupName $_ -FullData | Where-Object { $_.objectsid -notmatch "S-1-5-32-544" } | ForEach-Object { $_.objectsid }
            }

            # query for the primary domain controller so we can extract the domain SID for filtering
            $DomainSID = Get-DomainSID -Domain $Domain
        }

        # script block that enumerates a server
        $HostEnumBlock = {
            param($ComputerName, $Ping, $OutFile, $DomainSID, $TrustGroupsSIDs, $API, $DomainOnly)

            # optionally check if the server is up first
            $Up = $True
            if($Ping) {
                $Up = Test-Connection -Count 1 -Quiet -ComputerName $ComputerName
            }
            if($Up) {
                # grab the users for the local admins on this server
                if($API) {
                    $LocalAdmins = Get-NetLocalGroup -ComputerName $ComputerName -API
                }
                else {
                    $LocalAdmins = Get-NetLocalGroup -ComputerName $ComputerName
                }

                # if we just want to return cross-trust users
                if($DomainSID) {
                    # get the local machine SID
                    $LocalSID = ($LocalAdmins | Where-Object { $_.SID -match '.*-500$' }).SID -replace "-500$"
                    Write-Verbose "LocalSid for $ComputerName : $LocalSID"
                    # filter out accounts that begin with the machine SID and domain SID
                    #   but preserve any groups that have users across a trust ($TrustGroupSIDS)
                    $LocalAdmins = $LocalAdmins | Where-Object { ($TrustGroupsSIDs -contains $_.SID) -or ((-not $_.SID.startsWith($LocalSID)) -and (-not $_.SID.startsWith($DomainSID))) }
                }

                if($DomainOnly) {
                    $LocalAdmins = $LocalAdmins | Where-Object {$_.IsDomain}
                }

                if($LocalAdmins -and ($LocalAdmins.Length -ne 0)) {
                    # output the results to a csv if specified
                    if($OutFile) {
                        $LocalAdmins | Export-PowerViewCSV -OutFile $OutFile
                    }
                    else {
                        # otherwise return the user objects
                        $LocalAdmins
                    }
                }
                else {
                    Write-Verbose "[!] No users returned from $ComputerName"
                }
            }
        }
    }

    process {

        if($Threads) {
            Write-Verbose "Using threading with threads = $Threads"

            # if we're using threading, kick off the script block with Invoke-ThreadedFunction
            $ScriptParams = @{
                'Ping' = $(-not $NoPing)
                'OutFile' = $OutFile
                'DomainSID' = $DomainSID
                'TrustGroupsSIDs' = $TrustGroupsSIDs
            }

            # kick off the threaded script block + arguments
            if($API) {
                $ScriptParams['API'] = $True
            }

            if($DomainOnly) {
                $ScriptParams['DomainOnly'] = $True
            }
         
            Invoke-ThreadedFunction -ComputerName $ComputerName -ScriptBlock $HostEnumBlock -ScriptParameters $ScriptParams -Threads $Threads
        }

        else {
            if(-not $NoPing -and ($ComputerName.count -ne 1)) {
                # ping all hosts in parallel
                $Ping = {param($ComputerName) if(Test-Connection -ComputerName $ComputerName -Count 1 -Quiet -ErrorAction Stop){$ComputerName}}
                $ComputerName = Invoke-ThreadedFunction -NoImports -ComputerName $ComputerName -ScriptBlock $Ping -Threads 100
            }

            Write-Verbose "[*] Total number of active hosts: $($ComputerName.count)"
            $Counter = 0

            ForEach ($Computer in $ComputerName) {

                $Counter = $Counter + 1

                # sleep for our semi-randomized interval
                Start-Sleep -Seconds $RandNo.Next((1-$Jitter)*$Delay, (1+$Jitter)*$Delay)
                Write-Verbose "[*] Enumerating server $Computer ($Counter of $($ComputerName.count))"

                $ScriptArgs = @($Computer, $False, $OutFile, $DomainSID, $TrustGroupsSIDs, $API, $DomainOnly)

                Invoke-Command -ScriptBlock $HostEnumBlock -ArgumentList $ScriptArgs
            }
        }
    }
}


########################################################
#
# Domain trust functions below.
#
########################################################

function Get-NetDomainTrust {
<#
    .SYNOPSIS

        Return all domain trusts for the current domain or
        a specified domain.

    .PARAMETER Domain

        The domain whose trusts to enumerate, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER API

        Use an API call (DsEnumerateDomainTrusts) to enumerate the trusts.

    .PARAMETER LDAP

        Switch. Use LDAP queries to enumerate the trusts instead of direct domain connections. 
        More likely to get around network segmentation, but not as accurate.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .EXAMPLE

        PS C:\> Get-NetDomainTrust

        Return domain trusts for the current domain using built in .NET methods.

    .EXAMPLE

        PS C:\> Get-NetDomainTrust -Domain "prod.testlab.local"

        Return domain trusts for the "prod.testlab.local" domain using .NET methods

    .EXAMPLE

        PS C:\> Get-NetDomainTrust -LDAP -Domain "prod.testlab.local" -DomainController "PRIMARY.testlab.local"

        Return domain trusts for the "prod.testlab.local" domain enumerated through LDAP
        queries, reflecting queries through the "Primary.testlab.local" domain controller,
        using .NET methods.

    .EXAMPLE

        PS C:\> Get-NetDomainTrust -API -Domain "prod.testlab.local"

        Return domain trusts for the "prod.testlab.local" domain enumerated through API calls.

    .EXAMPLE

        PS C:\> Get-NetDomainTrust -API -DomainController WINDOWS2.testlab.local

        Return domain trusts reachable from the WINDOWS2 machine through API calls.
#>

    [CmdletBinding()]
    param(
        [Parameter(Position=0,ValueFromPipeline=$True)]
        [String]
        $Domain,

        [String]
        $DomainController,

        [Switch]
        $API,

        [Switch]
        $LDAP,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    process {

        if((-not $Domain) -or ((-not $API) -and (-not $DomainController))) {
            $Domain = (Get-NetDomain -Credential $Credential).Name
        }

        if($LDAP) {

            $TrustSearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -PageSize $PageSize
            $SourceSID = Get-DomainSID -Domain $Domain -DomainController $DomainController

            if($TrustSearcher) {

                $TrustSearcher.filter = '(&(objectClass=trustedDomain))'

                $Results = $TrustSearcher.FindAll()
                $Results | Where-Object {$_} | ForEach-Object {
                    $Props = $_.Properties
                    $DomainTrust = New-Object PSObject
                    $TrustAttrib = Switch ($Props.trustattributes)
                    {
                        0x001 { "non_transitive" }
                        0x002 { "uplevel_only" }
                        0x004 { "quarantined_domain" }
                        0x008 { "forest_transitive" }
                        0x010 { "cross_organization" }
                        0x020 { "within_forest" }
                        0x040 { "treat_as_external" }
                        0x080 { "trust_uses_rc4_encryption" }
                        0x100 { "trust_uses_aes_keys" }
                        Default { 
                            Write-Warning "Unknown trust attribute: $($Props.trustattributes)";
                            "$($Props.trustattributes)";
                        }
                    }
                    $Direction = Switch ($Props.trustdirection) {
                        0 { "Disabled" }
                        1 { "Inbound" }
                        2 { "Outbound" }
                        3 { "Bidirectional" }
                    }
                    $ObjectGuid = New-Object Guid @(,$Props.objectguid[0])
                    $TargetSID = (New-Object System.Security.Principal.SecurityIdentifier($Props.securityidentifier[0],0)).Value
                    $DomainTrust | Add-Member Noteproperty 'SourceName' $Domain
                    $DomainTrust | Add-Member Noteproperty 'SourceSID' $SourceSID
                    $DomainTrust | Add-Member Noteproperty 'TargetName' $Props.name[0]
                    $DomainTrust | Add-Member Noteproperty 'TargetSID' $TargetSID
                    $DomainTrust | Add-Member Noteproperty 'ObjectGuid' "{$ObjectGuid}"
                    $DomainTrust | Add-Member Noteproperty 'TrustType' "$TrustAttrib"
                    $DomainTrust | Add-Member Noteproperty 'TrustDirection' "$Direction"
                    $DomainTrust
                }
                $Results.dispose()
                $TrustSearcher.dispose()
            }
        }
        elseif($API) {
            if(-not $DomainController) {
                $DomainController = Get-NetDomainController -Credential $Credential -Domain $Domain | Select-Object -First 1 | Select-Object -ExpandProperty Name
            }

            if($DomainController) {
                # arguments for DsEnumerateDomainTrusts
                $PtrInfo = [IntPtr]::Zero

                # 63 = DS_DOMAIN_IN_FOREST + DS_DOMAIN_DIRECT_OUTBOUND + DS_DOMAIN_TREE_ROOT + DS_DOMAIN_PRIMARY + DS_DOMAIN_NATIVE_MODE + DS_DOMAIN_DIRECT_INBOUND
                $Flags = 63
                $DomainCount = 0

                # get the trust information from the target server
                $Result = $Netapi32::DsEnumerateDomainTrusts($DomainController, $Flags, [ref]$PtrInfo, [ref]$DomainCount)

                # Locate the offset of the initial intPtr
                $Offset = $PtrInfo.ToInt64()

                Write-Debug "DsEnumerateDomainTrusts result for $DomainController : $Result"

                # 0 = success
                if (($Result -eq 0) -and ($Offset -gt 0)) {

                    # Work out how mutch to increment the pointer by finding out the size of the structure
                    $Increment = $DS_DOMAIN_TRUSTS::GetSize()

                    # parse all the result structures
                    for ($i = 0; ($i -lt $DomainCount); $i++) {
                        # create a new int ptr at the given offset and cast
                        #   the pointer as our result structure
                        $NewIntPtr = New-Object System.Intptr -ArgumentList $Offset
                        $Info = $NewIntPtr -as $DS_DOMAIN_TRUSTS

                        $Offset = $NewIntPtr.ToInt64()
                        $Offset += $Increment

                        $SidString = ""
                        $Result = $Advapi32::ConvertSidToStringSid($Info.DomainSid, [ref]$SidString)

                        if($Result -eq 0) {
                            # error codes - http://msdn.microsoft.com/en-us/library/windows/desktop/ms681382(v=vs.85).aspx
                            $Err = $Kernel32::GetLastError()
                            Write-Error "ConvertSidToStringSid LastError: $Err"
                        }
                        else {
                            $DomainTrust = New-Object PSObject
                            $DomainTrust | Add-Member Noteproperty 'SourceDomain' $Domain
                            $DomainTrust | Add-Member Noteproperty 'SourceDomainController' $DomainController
                            $DomainTrust | Add-Member Noteproperty 'NetbiosDomainName' $Info.NetbiosDomainName
                            $DomainTrust | Add-Member Noteproperty 'DnsDomainName' $Info.DnsDomainName
                            $DomainTrust | Add-Member Noteproperty 'Flags' $Info.Flags
                            $DomainTrust | Add-Member Noteproperty 'ParentIndex' $Info.ParentIndex
                            $DomainTrust | Add-Member Noteproperty 'TrustType' $Info.TrustType
                            $DomainTrust | Add-Member Noteproperty 'TrustAttributes' $Info.TrustAttributes
                            $DomainTrust | Add-Member Noteproperty 'DomainSid' $SidString
                            $DomainTrust | Add-Member Noteproperty 'DomainGuid' $Info.DomainGuid
                            $DomainTrust.PSObject.TypeNames.Add('PowerView.APIDomainTrust')
                            $DomainTrust
                        }
                    }
                    # free up the result buffer
                    $Null = $Netapi32::NetApiBufferFree($PtrInfo)
                }
                else
                {
                    switch ($Result) {
                        (50)    { Write-Debug 'The request is not supported.' }
                        (1004)  { Write-Debug 'Invalid flags.' }
                        (1311)  { Write-Debug 'There are currently no logon servers available to service the logon request.' }
                        (1786)  { Write-Debug 'The workstation does not have a trust secret.' }
                        (1787)  { Write-Debug 'The security database on the server does not have a computer account for this workstation trust relationship.' }
                    }
                }
            }
            else {
                Write-Error "Could not retrieve domain controller for $Domain"
            }
        }
        else {
            # if we're using direct domain connections through .NET
            $FoundDomain = Get-NetDomain -Domain $Domain -Credential $Credential
            if($FoundDomain) {
                $FoundDomain.GetAllTrustRelationships()
            }
        }
    }
}


function Get-NetForestTrust {
<#
    .SYNOPSIS

        Return all trusts for the current forest.

    .PARAMETER Forest

        Return trusts for the specified forest.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetForestTrust

        Return current forest trusts.

    .EXAMPLE

        PS C:\> Get-NetForestTrust -Forest "test"

        Return trusts for the "test" forest.
#>

    [CmdletBinding()]
    param(
        [Parameter(Position=0,ValueFromPipeline=$True)]
        [String]
        $Forest,

        [Management.Automation.PSCredential]
        $Credential
    )

    process {
        $FoundForest = Get-NetForest -Forest $Forest -Credential $Credential

        if($FoundForest) {
            $FoundForest.GetAllTrustRelationships()
        }
    }
}


function Invoke-MapDomainTrust {
<#
    .SYNOPSIS

        This function gets all trusts for the current domain,
        and tries to get all trusts for each domain it finds.

    .PARAMETER LDAP

        Switch. Use LDAP queries to enumerate the trusts instead of direct domain connections.
        More likely to get around network segmentation, but not as accurate.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Invoke-MapDomainTrust | Export-CSV -NoTypeInformation trusts.csv
        
        Map all reachable domain trusts and output everything to a .csv file.

    .LINK

        http://blog.harmj0y.net/
#>
    [CmdletBinding()]
    param(
        [Switch]
        $LDAP,

        [String]
        $DomainController,

        [ValidateRange(1,10000)] 
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    # keep track of domains seen so we don't hit infinite recursion
    $SeenDomains = @{}

    # our domain status tracker
    $Domains = New-Object System.Collections.Stack

    # get the current domain and push it onto the stack
    $CurrentDomain = (Get-NetDomain -Credential $Credential).Name
    $Domains.push($CurrentDomain)

    while($Domains.Count -ne 0) {

        $Domain = $Domains.Pop()

        # if we haven't seen this domain before
        if ($Domain -and ($Domain.Trim() -ne "") -and (-not $SeenDomains.ContainsKey($Domain))) {
            
            Write-Verbose "Enumerating trusts for domain '$Domain'"

            # mark it as seen in our list
            $Null = $SeenDomains.add($Domain, "")

            try {
                # get all the trusts for this domain
                if($LDAP -or $DomainController) {
                    $Trusts = Get-NetDomainTrust -Domain $Domain -LDAP -DomainController $DomainController -PageSize $PageSize -Credential $Credential
                }
                else {
                    $Trusts = Get-NetDomainTrust -Domain $Domain -PageSize $PageSize -Credential $Credential
                }

                if($Trusts -isnot [system.array]) {
                    $Trusts = @($Trusts)
                }

                # get any forest trusts, if they exist
                $Trusts += Get-NetForestTrust -Forest $Domain -Credential $Credential

                if ($Trusts) {

                    # enumerate each trust found
                    ForEach ($Trust in $Trusts) {
                        $SourceDomain = $Trust.SourceName
                        $TargetDomain = $Trust.TargetName
                        $TrustType = $Trust.TrustType
                        $TrustDirection = $Trust.TrustDirection

                        # make sure we process the target
                        $Null = $Domains.push($TargetDomain)

                        # build the nicely-parsable custom output object
                        $DomainTrust = New-Object PSObject
                        $DomainTrust | Add-Member Noteproperty 'SourceDomain' "$SourceDomain"
                        $DomainTrust | Add-Member Noteproperty 'SourceSID' $Trust.SourceSID
                        $DomainTrust | Add-Member Noteproperty 'TargetDomain' "$TargetDomain"
                        $DomainTrust | Add-Member Noteproperty 'TargetSID' $Trust.TargetSID
                        $DomainTrust | Add-Member Noteproperty 'TrustType' "$TrustType"
                        $DomainTrust | Add-Member Noteproperty 'TrustDirection' "$TrustDirection"
                        $DomainTrust
                    }
                }
            }
            catch {
                Write-Warning "[!] Error: $_"
            }
        }
    }
}



########################################################
#
# BloodHound specific fuctions.
#
########################################################

function Export-BloodHoundData {
<#
    .SYNOPSIS

        Exports PowerView object data to a BloodHound instance.

    .PARAMETER Object

        The PowerView PSObject to insert into BloodHound.

    .PARAMETER BloodHoundUri

        The BloodHound neo4j URL location (http://host:port/).

    .PARAMETER BloodHoundUserPass

        The "user:password" for the BloodHound neo4j instance.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object that stores a BloodHound username
        and password for the neo4j connection.

    .PARAMETER Throttle

        The number of object insertion queries to run in each batch, defaults to 100.

    .EXAMPLE

        PS C:\> Get-NetGroupMember | Export-BloodHoundData -BloodHoundUri http://host:80/ -BloodHoundUserPass "user:pass"

        Export the Domain Admins group members to the given BloodHound database.

    .LINK

        http://neo4j.com/docs/stable/rest-api-batch-ops.html
        http://stackoverflow.com/questions/19839469/optimizing-high-volume-batch-inserts-into-neo4j-using-rest

#>
    [CmdletBinding(DefaultParameterSetName = 'None')]
    param(
        [Parameter(Position=0, ValueFromPipeline=$True, Mandatory = $True)]
        [PSObject]
        $Object,

        [Parameter(Position=1, Mandatory = $True)]
        [URI]
        $BloodHoundUri,

        [Parameter(Position=2, Mandatory = $True, ParameterSetName = 'PlaintextPW')]
        [String]
        [ValidatePattern('.*:.*')]
        $BloodHoundUserPass,

        [Parameter(Position=2, Mandatory = $True, ParameterSetName = 'PSCredential')]
        [Management.Automation.PSCredential]
        $Credential,

        [Parameter(Position=3)]
        [Int]
        $Throttle = 100
    )

    begin {
        $WebClient = New-Object System.Net.WebClient

        if($PSBoundParameters['Credential']) {
            $BloodHoundUserName = $Credential.UserName
            $BloodHoundPassword = $Credential.GetNetworkCredential().Password
            $Base64UserPass = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($BloodHoundUserName + ':' + $BloodHoundPassword))
        }
        else {
            $Base64UserPass = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($BloodHoundUserPass))
        }

        # add the auth headers
        $WebClient.Headers.Add('Accept','application/json; charset=UTF-8')
        $WebClient.Headers.Add('Authorization',"Basic $Base64UserPass")

        # check auth to the BloodHound neo4j server
        try {
            $Null = $WebClient.DownloadString($BloodHoundUri.AbsoluteUri + "user/neo4j")
            $Authorized = $True
        }
        catch [Net.WebException] {
            $Authorized = $False
            throw "Error connecting to Neo4j rest REST server at '$(BloodHoundUri.AbsoluteUri)' : $($_.Exception)"
        }

        Add-Type -Assembly System.Web.Extensions

        # from http://stackoverflow.com/questions/28077854/powershell-2-0-convertfrom-json-and-convertto-json-implementation
        function ConvertTo-Json20([object] $Item){
            $ps_js = New-Object System.Web.Script.Serialization.javascriptSerializer
            return $ps_js.Serialize($item)
        }

        $Authorized = $True
        $ObjectBuffer = New-Object System.Collections.ArrayList
    }
    
    process {
        if($Authorized) {

            if($Object.PSObject.TypeNames -contains 'PowerView.UserSession') {
                if($Object.SessionFromName) {
                    $Query = "MERGE (user:User { name: UPPER(`"$($Object.UserName)`") }) MERGE (computer:Computer { name: UPPER(`"$($Object.SessionFromName)`") }) MERGE (computer)-[:HasSession]->(user)"
                }
                elseif($Object.SessionFrom) {
                    $Query = "MERGE (user:User { name: UPPER(`"$($Object.UserName)`") }) MERGE (computer:Computer { name: UPPER(`"$($Object.SessionFrom)`") }) MERGE (computer)-[:HasSession]->(user)"
                }
                else {
                    # assume Get-NetLoggedOn result
                    $Query = "MERGE (user:User { name: UPPER('$($Object.UserName)') }) MERGE (computer:Computer { name: UPPER('$($Object.ComputerName)') }) MERGE (computer)-[:HasSession]->(user)"
                }
            }
            elseif($Object.PSObject.TypeNames -contains 'PowerView.GroupMember') {
                if($Object.IsGroup) {
                    $Query = "MERGE (group1:Group { name: UPPER('$($Object.MemberName)') }) MERGE (group2:Group { name: UPPER('$($Object.GroupName)') }) MERGE (group1)-[:MemberOf]->(group2)"
                }
                else {
                    $Query = "MERGE (user:User { name: UPPER('$($Object.MemberName)') }) MERGE (group:Group { name: UPPER('$($Object.GroupName)') }) MERGE (user)-[:MemberOf]->(group)"
                }
            }
            elseif($Object.PSObject.TypeNames -contains 'PowerView.LocalUser') {
                $AccountName = $($Object.AccountName.replace('/', '\')).split('\')[-1]

                if($Object.IsGroup) {
                    $Query = "MERGE (group:Group { name: UPPER('$AccountName') }) MERGE (computer:Computer { name: UPPER('$($Object.ComputerName)') }) MERGE (group)-[:AdminTo]->(computer)"
                }
                else {
                    $Query = "MERGE (user:User { name: UPPER('$AccountName') }) MERGE (computer:Computer { name: UPPER('$($Object.ComputerName)') }) MERGE (user)-[:AdminTo]->(computer)"
                }
            }
            else {
                Write-Verbose "No matching type name"
            }

            $BatchObject = @{
                "method" = "POST";
                "to" = "/cypher";
                "body" = @{"query"=$Query};
            }

            $Null = $ObjectBuffer.Add($BatchObject)

            if ($ObjectBuffer.Count -ge $Throttle) {
                $JsonRequest = ConvertTo-Json20 $ObjectBuffer
                $Null = $WebClient.UploadString($BloodHoundUri.AbsoluteUri + "db/data/batch", $JsonRequest)
                $ObjectBuffer.Clear()
            }
        }
        else {
            throw 'Not authorized'
        }
    }
    end {
        if($Authorized) {
            $JsonRequest = ConvertTo-Json20 $ObjectBuffer
            $Null = $WebClient.UploadString($BloodHoundUri.AbsoluteUri + "db/data/batch", $JsonRequest)
            $ObjectBuffer.Clear()
        }
    }
}


function Get-BloodHoundData {
<#
    .SYNOPSIS

        This function queries the domain for all active machines with
        Get-NetComputer, then for each server it queries the local
        Administrators with Get-NetLocalGroup and the users/sessions with
        Get-NetSession/Get-NetLoggedOn. It will return only domain localgroup
        data.

        Author: @harmj0y
        License: BSD 3-Clause

    .PARAMETER ComputerName

        Host array to enumerate, passable on the pipeline.

    .PARAMETER BloodHoundUri

        The BloodHound neo4j URL location (http://host:port/).

    .PARAMETER BloodHoundUserPass

        The "user:password" for the BloodHound neo4j instance.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object that stores a BloodHound username
        and password for the neo4j connection.

    .PARAMETER Domain

        Domain to query for machines, defaults to the current domain.
    
    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER SearchForest

        Switch. Search all domains in the forest for target users instead of just
        a single domain.

    .PARAMETER Threads

        The maximum concurrent threads to execute.

    .PARAMETER Throttle

        The number of object insertion queries to run in each batch for Export-BloodHoundData, defaults to 100.

    .EXAMPLE

        PS C:\> Get-BloodHoundData -BloodHoundUri http://host:80/ -BloodHoundUserPass "user:pass"

    .LINK

        http://blog.harmj0y.net/
#>

    [CmdletBinding(DefaultParameterSetName = 'None')]
    param(
        [Parameter(Position=0, ValueFromPipeline=$True)]
        [Alias('Hosts')]
        [String[]]
        $ComputerName,

        [Parameter(Position=1, Mandatory=$True)]
        [URI]
        $BloodHoundUri,

        [Parameter(Position=2, Mandatory=$True, ParameterSetName='PlaintextPW')]
        [String]
        [ValidatePattern('.*:.*')]
        $BloodHoundUserPass,

        [Parameter(Position=2, Mandatory=$True, ParameterSetName='PSCredential')]
        [Management.Automation.PSCredential]
        $Credential,

        [String]
        $Domain,

        [String]
        $DomainController,

        [Switch]
        $SearchForest,

        [ValidateRange(1,100)] 
        [Int]
        $Threads,

        [Int]
        $Throttle = 100
    )

    begin {
        
        Get-NetGroup -Domain $Domain -DomainController $DomainController | Get-NetGroupMember -Domain $Domain -DomainController $DomainController | Export-BloodHoundData -BloodHoundUri $BloodHoundUri -BloodhoundUserPass $BloodHoundUserPass -Throttle $Throttle

        if(!$ComputerName) { 
            [Array]$ComputerName = @()

            if($Domain) {
                $TargetDomains = @($Domain)
            }
            elseif($SearchForest) {
                # get ALL the domains in the forest to search
                $TargetDomains = Get-NetForestDomain | ForEach-Object { $_.Name }
            }
            else {
                # use the local domain
                $TargetDomains = @( (Get-NetDomain).name )
            }

            ForEach ($Domain in $TargetDomains) {
                Write-Verbose "[*] Querying domain $Domain for hosts"
                $ComputerName += Get-NetComputer -Domain $Domain -DomainController $DomainController
            }
            
            # remove any null target hosts, uniquify the list and shuffle it
            $ComputerName = $ComputerName | Where-Object { $_ } | Sort-Object -Unique | Sort-Object { Get-Random }
            if($($ComputerName.Count) -eq 0) {
                throw "No hosts found!"
            }
        }

        # script block that enumerates a server
        $HostEnumBlock = {
            param($ComputerName, $Ping)

            $Up = $True
            if($Ping) {
                $Up = Test-Connection -Count 1 -Quiet -ComputerName $ComputerName
            }
            if($Up) {
                # grab the users for the local admins on this server
                Get-NetLocalGroup -ComputerName $ComputerName -API | Where-Object {$_.IsDomain}

                $Sessions = Get-NetSession -ComputerName $ComputerName
                ForEach ($Session in $Sessions) {
                    $UserName = $Session.sesi10_username
                    $CName = $Session.sesi10_cname

                    if($CName -and $CName.StartsWith("\\")) {
                        $CName = $CName.TrimStart("\")
                    }

                    # make sure we have a result
                    if (($UserName) -and ($UserName.trim() -ne '') -and ($UserName -notmatch '\$') -and (!($UserName -match $CurrentUser))) {

                        $IPAddress = @(Get-IPAddress -ComputerName $ComputerName)[0].IPAddress
                        $FoundUser = New-Object PSObject
                        $FoundUser | Add-Member Noteproperty 'UserDomain' $_.MemberDomain
                        $FoundUser | Add-Member Noteproperty 'UserName' $UserName
                        $FoundUser | Add-Member Noteproperty 'ComputerName' $ComputerName
                        $FoundUser | Add-Member Noteproperty 'IPAddress' $IPAddress
                        $FoundUser | Add-Member Noteproperty 'SessionFrom' $CName

                        # Try to resolve the DNS hostname of $Cname
                        try {
                            $CNameDNSName = [System.Net.Dns]::GetHostEntry($CName) | Select-Object -ExpandProperty HostName
                        }
                        catch {
                            $CNameDNSName = $CName
                        }
                        $FoundUser | Add-Member NoteProperty 'SessionFromName' $CNameDNSName
                        $FoundUser | Add-Member Noteproperty 'LocalAdmin' $Null
                        $FoundUser.PSObject.TypeNames.Add('PowerView.UserSession')
                        $FoundUser
                    }
                }

                $LoggedOn = Get-NetLoggedon -ComputerName $ComputerName
                ForEach ($User in $LoggedOn) {
                    $UserName = $User.wkui1_username
                    $UserDomain = $User.wkui1_logon_domain

                    # ignore local account logons
                    #   TODO: better way to determine if network logon or not
                    if($ComputerName -notmatch "^$UserDomain") {
                        if (($UserName) -and ($UserName.trim() -ne '') -and ($UserName -notmatch '\$')) {
                            $IPAddress = @(Get-IPAddress -ComputerName $ComputerName)[0].IPAddress
                            $FoundUser = New-Object PSObject
                            $FoundUser | Add-Member Noteproperty 'UserDomain' $UserDomain
                            $FoundUser | Add-Member Noteproperty 'UserName' $UserName
                            $FoundUser | Add-Member Noteproperty 'ComputerName' $ComputerName
                            $FoundUser | Add-Member Noteproperty 'IPAddress' $IPAddress
                            $FoundUser | Add-Member Noteproperty 'SessionFrom' $Null
                            $FoundUser | Add-Member Noteproperty 'SessionFromName' $Null
                            $FoundUser | Add-Member Noteproperty 'LocalAdmin' $Null
                            $FoundUser.PSObject.TypeNames.Add('PowerView.UserSession')
                            $FoundUser
                        }
                    }
                }                
            }
        }
    }

    process {

        if($Threads) {
            Write-Verbose "Using threading with threads = $Threads"

            # if we're using threading, kick off the script block with Invoke-ThreadedFunction
            $ScriptParams = @{
                'Ping' = $True
            }

            Invoke-ThreadedFunction -ComputerName $ComputerName -ScriptBlock $HostEnumBlock -ScriptParameters $ScriptParams -Threads $Threads | Export-BloodHoundData -BloodHoundUri $BloodHoundUri -BloodhoundUserPass $BloodHoundUserPass -Throttle $Throttle
        }

        else {
            if($ComputerName.count -ne 1) {
                # ping all hosts in parallel
                $Ping = {param($ComputerName) if(Test-Connection -ComputerName $ComputerName -Count 1 -Quiet -ErrorAction Stop) { $ComputerName }}
                $ComputerName = Invoke-ThreadedFunction -NoImports -ComputerName $ComputerName -ScriptBlock $Ping -Threads 100
            }

            Write-Verbose "[*] Total number of active hosts: $($ComputerName.count)"
            $Counter = 0

            ForEach ($Computer in $ComputerName) {

                $Counter = $Counter + 1
                Write-Verbose "[*] Enumerating server $Computer ($Counter of $($ComputerName.count))"

                Invoke-Command -ScriptBlock $HostEnumBlock -ArgumentList @($Computer, $False) | Export-BloodHoundData -BloodHoundUri $BloodHoundUri -BloodhoundUserPass $BloodHoundUserPass -Throttle $Throttle
            }
        }
    }
}


########################################################
#
# Expose the Win32API functions and datastructures below
# using PSReflect. 
# Warning: Once these are executed, they are baked in 
# and can't be changed while the script is running!
#
########################################################

$Mod = New-InMemoryModule -ModuleName Win32

# all of the Win32 API functions we need
$FunctionDefinitions = @(
    (func netapi32 NetWkstaUserEnum ([Int]) @([String], [Int], [IntPtr].MakeByRefType(), [Int], [Int32].MakeByRefType(), [Int32].MakeByRefType(), [Int32].MakeByRefType())),
    (func netapi32 NetSessionEnum ([Int]) @([String], [String], [String], [Int], [IntPtr].MakeByRefType(), [Int], [Int32].MakeByRefType(), [Int32].MakeByRefType(), [Int32].MakeByRefType())),
    (func netapi32 NetLocalGroupGetMembers ([Int]) @([String], [String], [Int], [IntPtr].MakeByRefType(), [Int], [Int32].MakeByRefType(), [Int32].MakeByRefType(), [Int32].MakeByRefType())),
    (func netapi32 NetApiBufferFree ([Int]) @([IntPtr])),
    (func netapi32 DsEnumerateDomainTrusts ([Int]) @([String], [UInt32], [IntPtr].MakeByRefType(), [IntPtr].MakeByRefType())),
    (func advapi32 ConvertSidToStringSid ([Int]) @([IntPtr], [String].MakeByRefType())),
    (func kernel32 GetLastError ([Int]) @())
)

# the NetWkstaUserEnum result structure
$WKSTA_USER_INFO_1 = struct $Mod WKSTA_USER_INFO_1 @{
    wkui1_username = field 0 String -MarshalAs @('LPWStr')
    wkui1_logon_domain = field 1 String -MarshalAs @('LPWStr')
    wkui1_oth_domains = field 2 String -MarshalAs @('LPWStr')
    wkui1_logon_server = field 3 String -MarshalAs @('LPWStr')
}

# the NetSessionEnum result structure
$SESSION_INFO_10 = struct $Mod SESSION_INFO_10 @{
    sesi10_cname = field 0 String -MarshalAs @('LPWStr')
    sesi10_username = field 1 String -MarshalAs @('LPWStr')
    sesi10_time = field 2 UInt32
    sesi10_idle_time = field 3 UInt32
}

# enum used by $LOCALGROUP_MEMBERS_INFO_2 below
$SID_NAME_USE = psenum $Mod SID_NAME_USE UInt16 @{
    SidTypeUser             = 1
    SidTypeGroup            = 2
    SidTypeDomain           = 3
    SidTypeAlias            = 4
    SidTypeWellKnownGroup   = 5
    SidTypeDeletedAccount   = 6
    SidTypeInvalid          = 7
    SidTypeUnknown          = 8
    SidTypeComputer         = 9
}

# the NetLocalGroupGetMembers result structure
$LOCALGROUP_MEMBERS_INFO_2 = struct $Mod LOCALGROUP_MEMBERS_INFO_2 @{
    lgrmi2_sid = field 0 IntPtr
    lgrmi2_sidusage = field 1 $SID_NAME_USE
    lgrmi2_domainandname = field 2 String -MarshalAs @('LPWStr')
}

# enums used in DS_DOMAIN_TRUSTS
$DsDomainFlag = psenum $Mod DsDomain.Flags UInt32 @{
    IN_FOREST       = 1
    DIRECT_OUTBOUND = 2
    TREE_ROOT       = 4
    PRIMARY         = 8
    NATIVE_MODE     = 16
    DIRECT_INBOUND  = 32
} -Bitfield
$DsDomainTrustType = psenum $Mod DsDomain.TrustType UInt32 @{
    DOWNLEVEL   = 1
    UPLEVEL     = 2
    MIT         = 3
    DCE         = 4
}
$DsDomainTrustAttributes = psenum $Mod DsDomain.TrustAttributes UInt32 @{
    NON_TRANSITIVE      = 1
    UPLEVEL_ONLY        = 2
    FILTER_SIDS         = 4
    FOREST_TRANSITIVE   = 8
    CROSS_ORGANIZATION  = 16
    WITHIN_FOREST       = 32
    TREAT_AS_EXTERNAL   = 64
}

# the DsEnumerateDomainTrusts result structure
$DS_DOMAIN_TRUSTS = struct $Mod DS_DOMAIN_TRUSTS @{
    NetbiosDomainName = field 0 String -MarshalAs @('LPWStr')
    DnsDomainName = field 1 String -MarshalAs @('LPWStr')
    Flags = field 2 $DsDomainFlag
    ParentIndex = field 3 UInt32
    TrustType = field 4 $DsDomainTrustType
    TrustAttributes = field 5 $DsDomainTrustAttributes
    DomainSid = field 6 IntPtr
    DomainGuid = field 7 Guid
}


$Types = $FunctionDefinitions | Add-Win32Type -Module $Mod -Namespace 'Win32'
$Netapi32 = $Types['netapi32']
$Advapi32 = $Types['advapi32']
$Kernel32 = $Types['kernel32']

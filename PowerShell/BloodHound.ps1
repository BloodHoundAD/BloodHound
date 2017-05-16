#requires -version 2

<#

    File: BloodHound.ps1
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


########################################################
#
# Misc. helpers
#
########################################################

filter Get-IniContent {
<#
    .SYNOPSIS

        This helper parses an .ini file into a proper PowerShell object.

        Author: 'The Scripting Guys'
        Link: https://blogs.technet.microsoft.com/heyscriptingguy/2011/08/20/use-powershell-to-work-with-any-ini-file/

    .LINK

        https://blogs.technet.microsoft.com/heyscriptingguy/2011/08/20/use-powershell-to-work-with-any-ini-file/
#>
    [CmdletBinding()]
    Param(
        [Parameter(Mandatory=$True, ValueFromPipeline=$True, ValueFromPipelineByPropertyName=$True)]
        [Alias('FullName')]
        [ValidateScript({ Test-Path -Path $_ })]
        [String[]]
        $Path
    )

    ForEach($TargetPath in $Path) {
        $IniObject = @{}
        Switch -Regex -File $TargetPath {
            "^\[(.+)\]" # Section
            {
                $Section = $matches[1].Trim()
                $IniObject[$Section] = @{}
                $CommentCount = 0
            }
            "^(;.*)$" # Comment
            {
                $Value = $matches[1].Trim()
                $CommentCount = $CommentCount + 1
                $Name = 'Comment' + $CommentCount
                $IniObject[$Section][$Name] = $Value
            }
            "(.+?)\s*=(.*)" # Key
            {
                $Name, $Value = $matches[1..2]
                $Name = $Name.Trim()
                $Values = $Value.split(',') | ForEach-Object {$_.Trim()}
                if($Values -isnot [System.Array]) {$Values = @($Values)}
                $IniObject[$Section][$Name] = $Values
            }
        }
        $IniObject
    }
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


filter Convert-NameToSid {
<#
    .SYNOPSIS

        Converts a given user/group name to a security identifier (SID).

    .PARAMETER ObjectName

        The user/group name to convert, can be 'user' or 'DOMAIN\user' format.

    .PARAMETER Domain

        Specific domain for the given user account, defaults to the current domain.

    .EXAMPLE

        PS C:\> Convert-NameToSid 'DEV\dfm'
#>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$True, ValueFromPipeline=$True)]
        [String]
        [Alias('Name')]
        $ObjectName,

        [String]
        $Domain
    )

    $ObjectName = $ObjectName -Replace "/","\"

    if($ObjectName.Contains("\")) {
        # if we get a DOMAIN\user format, auto convert it
        $Domain = $ObjectName.Split("\")[0]
        $ObjectName = $ObjectName.Split("\")[1]
    }
    elseif(-not $Domain) {
        $Domain = (Get-NetDomain).Name
    }

    try {
        $Obj = (New-Object System.Security.Principal.NTAccount($Domain, $ObjectName))
        $SID = $Obj.Translate([System.Security.Principal.SecurityIdentifier]).Value

        $Out = New-Object PSObject
        $Out | Add-Member Noteproperty 'ObjectName' $ObjectName
        $Out | Add-Member Noteproperty 'SID' $SID
        $Out
    }
    catch {
        Write-Verbose "Invalid object/name: $Domain\$ObjectName"
        $Null
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
        Switch ($SID2) {
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
        Write-Verbose "Invalid SID: $SID"
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

        The InputType of the user/group name ("NT4","DN","Simple","Canonical").

    .PARAMETER OutputType

        The OutputType of the user/group name ("NT4","DN","Simple","Canonical").

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
        [ValidateSet("NT4","DN","Simple","Canonical")]
        $InputType,

        [String]
        [ValidateSet("NT4","DN","Simple","Canonical")]
        $OutputType
    )

    $NameTypes = @{
        'DN'        = 1
        'Canonical' = 2
        'NT4'       = 3
        'Simple'    = 5
    }

    if(-not $PSBoundParameters['InputType']) {
        if( ($ObjectName.split('/')).Count -eq 2 ) {
            $ObjectName = $ObjectName.replace('/', '\')
        }

        if($ObjectName -match "^[A-Za-z]+\\[A-Za-z ]+") {
            $InputType = 'NT4'
        }
        elseif($ObjectName -match "^[A-Za-z ]+@[A-Za-z\.]+") {
            $InputType = 'Simple'
        }
        elseif($ObjectName -match "^[A-Za-z\.]+/[A-Za-z]+/[A-Za-z/ ]+") {
            $InputType = 'Canonical'
        }
        elseif($ObjectName -match '^CN=.*') {
            $InputType = 'DN'
        }
        else {
            Write-Warning "Can not identify InType for $ObjectName"
        }
    }
    elseif($InputType -eq 'NT4') {
        $ObjectName = $ObjectName.replace('/', '\')
    }

    if(-not $PSBoundParameters['OutputType']) {
        $OutputType = Switch($InputType) {
            'NT4' {'Canonical'}
            'Simple' {'NT4'}
            'DN' {'NT4'}
            'Canonical' {'NT4'}
        }
    }

    # try to extract the domain from the given format
    $Domain = Switch($InputType) {
        'NT4' { $ObjectName.split("\")[0] }
        'Simple' { $ObjectName.split("@")[1] }
        'Canonical' { $ObjectName.split("/")[0] }
        'DN' {$ObjectName.subString($ObjectName.IndexOf('DC=')) -replace 'DC=','' -replace ',','.'}
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
        # Write-Verbose "Error with translate init in Convert-ADName: $_"
    }

    Set-Property $Translate "ChaseReferral" (0x60)

    try {
        Invoke-Method $Translate "Set" ($NameTypes[$InputType], $ObjectName)
        (Invoke-Method $Translate "Get" ($NameTypes[$OutputType]))
    }
    catch [System.Management.Automation.MethodInvocationException] {
        # Write-Verbose "Error with translate Set/Get in Convert-ADName: $_"
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

    if(-not $Credential) {
        if(-not $Domain) {
            $Domain = (Get-NetDomain).name
        }
        elseif(-not $DomainController) {
            try {
                # if there's no -DomainController specified, try to pull the primary DC to reflect queries through
                $DomainController = ((Get-NetDomain).PdcRoleOwner).Name
            }
            catch {
                throw "Get-DomainSearcher: Error in retrieving PDC for current domain"
            }
        }
    }
    elseif (-not $DomainController) {
        # if a DC isn't specified
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
            $SearchString += '/'
        }
    }

    if($ADSprefix) {
        $SearchString += $ADSprefix + ','
    }

    if($ADSpath) {
        if($ADSpath -Match '^GC://') {
            # if we're searching the global catalog
            $DN = $AdsPath.ToUpper().Trim('/')
            $SearchString = ''
        }
        else {
            if($ADSpath -match '^LDAP://') {
                if($ADSpath -match "LDAP://.+/.+") {
                    $SearchString = ''
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
            Write-Verbose "The specified domain does '$Domain' not exist, could not be contacted, there isn't an existing trust, or the specified credentials are invalid."
            $Null
        }
    }
    elseif($Domain) {
        $DomainContext = New-Object System.DirectoryServices.ActiveDirectory.DirectoryContext('Domain', $Domain)
        try {
            [System.DirectoryServices.ActiveDirectory.Domain]::GetDomain($DomainContext)
        }
        catch {
            Write-Verbose "The specified domain '$Domain' does not exist, could not be contacted, or there isn't an existing trust."
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
            Write-Verbose "The specified forest '$Forest' does not exist, could not be contacted, there isn't an existing trust, or the specified credentials are invalid."
            $Null
        }
    }
    elseif($Forest) {
        $ForestContext = New-Object System.DirectoryServices.ActiveDirectory.DirectoryContext('Forest', $Forest)
        try {
            $ForestObject = [System.DirectoryServices.ActiveDirectory.Forest]::GetForest($ForestContext)
        }
        catch {
            Write-Verbose "The specified forest '$Forest' does not exist, could not be contacted, or there isn't an existing trust."
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
            Write-Verbose "Get-NetComputer filter : $CompFilter"
            $CompSearcher.filter = $CompFilter
            if(-not $FullData) {
                $Null = $CompSearcher.PropertiesToLoad.Add('dnshostname')
            }

            try {
                ForEach($ComputerResult in $CompSearcher.FindAll()) {
                    if($ComputerResult) {
                        $Up = $True
                        if($Ping) {
                            $Up = Test-Connection -Count 1 -Quiet -ComputerName $ComputerResult.properties.dnshostname
                        }
                        if($Up) {
                            # return full data objects
                            if ($FullData) {
                                # convert/process the LDAP fields for each result
                                $Computer = Convert-LDAPProperty -Properties $ComputerResult.Properties
                                $Computer.PSObject.TypeNames.Add('PowerView.Computer')
                                $Computer
                            }
                            else {
                                # otherwise we're just returning the DNS host name
                                $ComputerResult.properties.dnshostname
                            }
                        }
                    }
                }

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
        if($SID -and (-not $Domain)) {
            # if a SID is passed, try to resolve it to a reachable domain name for the searcher
            try {
                $Name = Convert-SidToName $SID
                if($Name) {
                    $Canonical = Convert-ADName -ObjectName $Name -InputType NT4 -OutputType Canonical
                    if($Canonical) {
                        $Domain = $Canonical.split("/")[0]
                    }
                    else {
                        Write-Verbose "Error resolving SID '$SID'"
                        return $Null
                    }
                }
            }
            catch {
                Write-Verbose "Error resolving SID '$SID' : $_"
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

            try {
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
            }
            catch {
                Write-Verbose "Error building the searcher object!"
            }
            $ObjectSearcher.dispose()
        }
    }
}


function Get-NetOU {
<#
    .SYNOPSIS

        Gets a list of all current OUs in a domain.

    .PARAMETER OUName

        The OU name to query for, wildcards accepted.

    .PARAMETER GUID

        Only return OUs with the specified GUID in their gplink property.

    .PARAMETER Domain

        The domain to query for OUs, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through.

    .PARAMETER FullData

        Switch. Return full OU objects instead of just object names (the default).

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetOU

        Returns the current OUs in the domain.

    .EXAMPLE

        PS C:\> Get-NetOU -OUName *admin* -Domain testlab.local

        Returns all OUs with "admin" in their name in the testlab.local domain.

     .EXAMPLE

        PS C:\> Get-NetOU -GUID 123-...

        Returns all OUs with linked to the specified group policy object.

     .EXAMPLE

        PS C:\> "*admin*","*server*" | Get-NetOU

        Get the full OU names for the given search terms piped on the pipeline.
#>

    [CmdletBinding()]
    Param (
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $OUName = '*',

        [String]
        $GUID,

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

        [Switch]
        $FullData,

        [ValidateRange(1,10000)]
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    begin {
        $OUSearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize
    }
    process {
        if ($OUSearcher) {
            if ($GUID) {
                # if we're filtering for a GUID in .gplink
                $OUSearcher.filter="(&(objectCategory=organizationalUnit)(name=$OUName)(gplink=*$GUID*))"
            }
            else {
                $OUSearcher.filter="(&(objectCategory=organizationalUnit)(name=$OUName))"
            }

            try {
                $Results = $OUSearcher.FindAll()
                $Results | Where-Object {$_} | ForEach-Object {
                    if ($FullData) {
                        # convert/process the LDAP fields for each result
                        $OU = Convert-LDAPProperty -Properties $_.Properties
                        $OU.PSObject.TypeNames.Add('PowerView.OU')
                        $OU
                    }
                    else {
                        # otherwise just returning the ADS paths of the OUs
                        $_.properties.adspath
                    }
                }
                $Results.dispose()
                $OUSearcher.dispose()
            }
            catch {
                Write-Warning $_
            }
        }
    }
}


function Get-NetSite {
<#
    .SYNOPSIS

        Gets a list of all current sites in a domain.

    .PARAMETER SiteName

        Site filter string, wildcards accepted.

    .PARAMETER Domain

        The domain to query for sites, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through.

    .PARAMETER GUID

        Only return site with the specified GUID in their gplink property.

    .PARAMETER FullData

        Switch. Return full site objects instead of just object names (the default).

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .PARAMETER Credential

        A [Management.Automation.PSCredential] object of alternate credentials
        for connection to the target domain.

    .EXAMPLE

        PS C:\> Get-NetSite -Domain testlab.local -FullData

        Returns the full data objects for all sites in testlab.local
#>

    [CmdletBinding()]
    Param (
        [Parameter(ValueFromPipeline=$True)]
        [String]
        $SiteName = "*",

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

        [String]
        $GUID,

        [Switch]
        $FullData,

        [ValidateRange(1,10000)]
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    begin {
        $SiteSearcher = Get-DomainSearcher -ADSpath $ADSpath -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSprefix "CN=Sites,CN=Configuration" -PageSize $PageSize
    }
    process {
        if($SiteSearcher) {

            if ($GUID) {
                # if we're filtering for a GUID in .gplink
                $SiteSearcher.filter="(&(objectCategory=site)(name=$SiteName)(gplink=*$GUID*))"
            }
            else {
                $SiteSearcher.filter="(&(objectCategory=site)(name=$SiteName))"
            }

            try {
                $Results = $SiteSearcher.FindAll()
                $Results | Where-Object {$_} | ForEach-Object {
                    if ($FullData) {
                        # convert/process the LDAP fields for each result
                        $Site = Convert-LDAPProperty -Properties $_.Properties
                        $Site.PSObject.TypeNames.Add('PowerView.Site')
                        $Site
                    }
                    else {
                        # otherwise just return the site name
                        $_.properties.name
                    }
                }
                $Results.dispose()
                $SiteSearcher.dispose()
            }
            catch {
                Write-Verbose $_
            }
        }
    }
}


function Get-DomainSID {
<#
    .SYNOPSIS

        Gets the SID for the domain.

    .PARAMETER Domain

        The domain to query, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .EXAMPLE

        C:\> Get-DomainSID -Domain TEST

        Returns SID for the domain 'TEST'
#>

    param(
        [String]
        $Domain,

        [String]
        $DomainController
    )

    $ComputerSearcher = Get-DomainSearcher -Domain $TargetDomain -DomainController $DomainController
    $ComputerSearcher.Filter = '(sAMAccountType=805306369)'
    $Null = $ComputerSearcher.PropertiesToLoad.Add('objectsid')
    $Result = $ComputerSearcher.FindOne()

    if(-not $Result) {
        Write-Verbose "Get-DomainSID: no results retrieved"
    }
    else {
        $DCObject = Convert-LDAPProperty -Properties $Result.Properties
        $DCSID = $DCObject.objectsid
        $DCSID.Substring(0, $DCSID.LastIndexOf('-'))
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

        [ValidateRange(1,10000)]
        [Int]
        $PageSize = 200,

        [Management.Automation.PSCredential]
        $Credential
    )

    function Split-Path {
        # short internal helper to split UNC server paths
        param([String]$Path)

        if ($Path -and ($Path.split("\\").Count -ge 3)) {
            $Temp = $Path.split("\\")[2]
            if($Temp -and ($Temp -ne '')) {
                $Temp
            }
        }
    }

    $UserSearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -PageSize $PageSize

    # only search for user objects that have one of the fields we're interested in set
    $UserSearcher.filter = "(&(samAccountType=805306368)(|(homedirectory=*)(scriptpath=*)(profilepath=*)))"

    # only return the fields we're interested in
    $UserSearcher.PropertiesToLoad.AddRange(('homedirectory', 'scriptpath', 'profilepath'))

    # get all results w/o the pipeline and uniquify them (I know it's not pretty)
    Sort-Object -Unique -InputObject $(ForEach($UserResult in $UserSearcher.FindAll()) {if($UserResult.Properties['homedirectory']) {Split-Path($UserResult.Properties['homedirectory'])}if($UserResult.Properties['scriptpath']) {Split-Path($UserResult.Properties['scriptpath'])}if($UserResult.Properties['profilepath']) {Split-Path($UserResult.Properties['profilepath'])}})
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
                            Write-Verbose "Error in parsing DFS share : $_"
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
                            Write-Verbose "Error in parsing target : $_"
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
                Write-Verbose "Error mounting path $GptTmplPath : $_"
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
        try {
            Write-Verbose "Attempting to parse GptTmpl: $TargetGptTmplPath"
            $TargetGptTmplPath | Get-IniContent -ErrorAction SilentlyContinue
        }
        catch {
            # Write-Verbose "Error parsing $TargetGptTmplPath : $_"
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

    .PARAMETER UsePSDrive

        Switch. Mount the target groups.xml folder path as a temporary PSDrive.
#>

    [CmdletBinding()]
    Param (
        [Parameter(Mandatory=$True, ValueFromPipeline=$True)]
        [String]
        $GroupsXMLPath,

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
                Write-Verbose "Error mounting path $GroupsXMLPath : $_"
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
            Write-Verbose "Attempting to parse Groups.xml: $TargetGroupsXMLPath"
            [XML]$GroupsXMLcontent = Get-Content $TargetGroupsXMLPath -ErrorAction Stop

            # process all group properties in the XML
            $GroupsXMLcontent | Select-Xml "//Groups" | Select-Object -ExpandProperty node | ForEach-Object {

                $Groupname = $_.Group.Properties.groupName

                # extract the localgroup sid for memberof
                $GroupSID = $_.Group.Properties.GroupSid
                if(-not $LocalSid) {
                    if($Groupname -match 'Administrators') {
                        $GroupSID = 'S-1-5-32-544'
                    }
                    elseif($Groupname -match 'Remote Desktop') {
                        $GroupSID = 'S-1-5-32-555'
                    }
                    elseif($Groupname -match 'Guests') {
                        $GroupSID = 'S-1-5-32-546'
                    }
                    else {
                        $GroupSID = Convert-NameToSid -ObjectName $Groupname | Select-Object -ExpandProperty SID
                    }
                }

                # extract out members added to this group
                $Members = $_.Group.Properties.members | Select-Object -ExpandProperty Member | Where-Object { $_.action -match 'ADD' } | ForEach-Object {
                    if($_.sid) { $_.sid }
                    else { $_.name }
                }

                if ($Members) {

                    # extract out any/all filters...I hate you GPP
                    if($_.Group.filters) {
                        $Filters = $_.Group.filters.GetEnumerator() | ForEach-Object {
                            New-Object -TypeName PSObject -Property @{'Type' = $_.LocalName;'Value' = $_.name}
                        }
                    }
                    else {
                        $Filters = $Null
                    }

                    if($Members -isnot [System.Array]) { $Members = @($Members) }

                    $GPOGroup = New-Object PSObject
                    $GPOGroup | Add-Member Noteproperty 'GPOPath' $TargetGroupsXMLPath
                    $GPOGroup | Add-Member Noteproperty 'Filters' $Filters
                    $GPOGroup | Add-Member Noteproperty 'GroupName' $GroupName
                    $GPOGroup | Add-Member Noteproperty 'GroupSID' $GroupSID
                    $GPOGroup | Add-Member Noteproperty 'GroupMemberOf' $Null
                    $GPOGroup | Add-Member Noteproperty 'GroupMembers' $Members
                    $GPOGroup
                }
            }
        }
        catch {
            # Write-Verbose "Error parsing $TargetGroupsXMLPath : $_"
        }
    }

    end {
        if($UsePSDrive -and $RandDrive) {
            Write-Verbose "Removing temp PSDrive $RandDrive"
            Get-PSDrive -Name $RandDrive -ErrorAction SilentlyContinue | Remove-PSDrive -Force
        }
    }
}


function Get-NetGPOGroup {
<#
    .SYNOPSIS

        Returns all GPOs in a domain that set "Restricted Groups" or use groups.xml on on target machines.

        Author: @harmj0y
        License: BSD 3-Clause
        Required Dependencies: Get-NetGPO, Get-GptTmpl, Get-GroupsXML, Convert-NameToSid, Convert-SidToName
        Optional Dependencies: None

    .DESCRIPTION

        First enumerates all GPOs in the current/target domain using Get-NetGPO with passed
        arguments, and for each GPO checks if 'Restricted Groups' are set with GptTmpl.inf or
        group membership is set through Group Policy Preferences groups.xml files. For any
        GptTmpl.inf files found, the file is parsed with Get-GptTmpl and any 'Group Membership'
        section data is processed if present. Any found Groups.xml files are parsed with
        Get-GroupsXML and those memberships are returned as well.

    .PARAMETER GPOname

        The GPO name to query for, wildcards accepted.

    .PARAMETER DisplayName

        The GPO display name to query for, wildcards accepted.

    .PARAMETER Domain

        The domain to query for GPOs, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to reflect LDAP queries through.

    .PARAMETER ADSpath

        The LDAP source to search through for GPOs.
        e.g. "LDAP://cn={8FF59D28-15D7-422A-BCB7-2AE45724125A},cn=policies,cn=system,DC=dev,DC=testlab,DC=local"

    .PARAMETER ResolveMemberSIDs

        Switch. Try to resolve the SIDs of all found group members.

    .PARAMETER UsePSDrive

        Switch. Mount any found policy files with temporary PSDrives.

    .PARAMETER PageSize

        The PageSize to set for the LDAP searcher object.

    .EXAMPLE

        PS C:\> Get-NetGPOGroup

        Returns all local groups set by GPO along with their members and memberof.

    .LINK

        https://morgansimonsenblog.azurewebsites.net/tag/groups/
#>

    [CmdletBinding()]
    Param (
        [String]
        $GPOname = '*',

        [String]
        $DisplayName,

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

        [Switch]
        $ResolveMemberSIDs,

        [Switch]
        $UsePSDrive,

        [ValidateRange(1,10000)]
        [Int]
        $PageSize = 200
    )

    $Option = [System.StringSplitOptions]::RemoveEmptyEntries

    $GPOSearcher = Get-DomainSearcher -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $ADSpath -PageSize $PageSize
    $GPOSearcher.filter="(&(objectCategory=groupPolicyContainer)(name=*)(gpcfilesyspath=*))"
    $GPOSearcher.PropertiesToLoad.AddRange(('displayname', 'name', 'gpcfilesyspath'))

    ForEach($GPOResult in $GPOSearcher.FindAll()) {

        $GPOdisplayName = $GPOResult.Properties['displayname']
        $GPOname = $GPOResult.Properties['name']
        $GPOPath = $GPOResult.Properties['gpcfilesyspath']
        Write-Verbose "Get-NetGPOGroup: enumerating $GPOPath"

        $ParseArgs =  @{
            'GptTmplPath' = "$GPOPath\MACHINE\Microsoft\Windows NT\SecEdit\GptTmpl.inf"
            'UsePSDrive' = $UsePSDrive
        }

        # parse the GptTmpl.inf 'Restricted Groups' file if it exists
        $Inf = Get-GptTmpl @ParseArgs

        if($Inf -and ($Inf.psbase.Keys -contains 'Group Membership')) {

            $Memberships = @{}

            # group the members/memberof fields for each entry
            ForEach ($Membership in $Inf.'Group Membership'.GetEnumerator()) {
                $Group, $Relation = $Membership.Key.Split('__', $Option) | ForEach-Object {$_.Trim()}

                # extract out ALL members
                $MembershipValue = $Membership.Value | Where-Object {$_} | ForEach-Object { $_.Trim('*') } | Where-Object {$_}

                if($ResolveMemberSIDs) {
                    # if the resulting member is username and not a SID, attempt to resolve it
                    $GroupMembers = @()
                    ForEach($Member in $MembershipValue) {
                        if($Member -and ($Member.Trim() -ne '')) {
                            if($Member -notmatch '^S-1-.*') {
                                $MemberSID = Convert-NameToSid -Domain $Domain -ObjectName $Member | Select-Object -ExpandProperty SID
                                if($MemberSID) {
                                    $GroupMembers += $MemberSID
                                }
                                else {
                                    $GroupMembers += $Member
                                }
                            }
                            else {
                                $GroupMembers += $Member
                            }
                        }
                    }
                    $MembershipValue = $GroupMembers
                }

                if(-not $Memberships[$Group]) {
                    $Memberships[$Group] = @{}
                }
                if($MembershipValue -isnot [System.Array]) {$MembershipValue = @($MembershipValue)}
                $Memberships[$Group].Add($Relation, $MembershipValue)
            }

            ForEach ($Membership in $Memberships.GetEnumerator()) {
                if($Membership -and $Membership.Key -and ($Membership.Key -match '^\*')) {
                    # if the SID is already resolved (i.e. begins with *) try to resolve SID to a name
                    $GroupSID = $Membership.Key.Trim('*')
                    if($GroupSID -and ($GroupSID.Trim() -ne '')) {
                        $GroupName = Convert-SidToName -SID $GroupSID
                    }
                    else {
                        $GroupName = $False
                    }
                }
                else {
                    $GroupName = $Membership.Key

                    if($GroupName -and ($GroupName.Trim() -ne '')) {
                        if($Groupname -match 'Administrators') {
                            $GroupSID = 'S-1-5-32-544'
                        }
                        elseif($Groupname -match 'Remote Desktop') {
                            $GroupSID = 'S-1-5-32-555'
                        }
                        elseif($Groupname -match 'Guests') {
                            $GroupSID = 'S-1-5-32-546'
                        }
                        elseif($GroupName.Trim() -ne '') {
                            $GroupSID = Convert-NameToSid -Domain $Domain -ObjectName $Groupname | Select-Object -ExpandProperty SID
                        }
                        else {
                            $GroupSID = $Null
                        }
                    }
                }

                $GPOGroup = New-Object PSObject
                $GPOGroup | Add-Member Noteproperty 'GPODisplayName' $GPODisplayName
                $GPOGroup | Add-Member Noteproperty 'GPOName' $GPOName
                $GPOGroup | Add-Member Noteproperty 'GPOPath' $GPOPath
                $GPOGroup | Add-Member Noteproperty 'GPOType' 'RestrictedGroups'
                $GPOGroup | Add-Member Noteproperty 'Filters' $Null
                $GPOGroup | Add-Member Noteproperty 'GroupName' $GroupName
                $GPOGroup | Add-Member Noteproperty 'GroupSID' $GroupSID
                $GPOGroup | Add-Member Noteproperty 'GroupMemberOf' $Membership.Value.Memberof
                $GPOGroup | Add-Member Noteproperty 'GroupMembers' $Membership.Value.Members
                $GPOGroup
            }
        }

        $ParseArgs =  @{
            'GroupsXMLpath' = "$GPOPath\MACHINE\Preferences\Groups\Groups.xml"
            'UsePSDrive' = $UsePSDrive
        }

        Get-GroupsXML @ParseArgs | ForEach-Object {
            if($ResolveMemberSIDs) {
                $GroupMembers = @()
                ForEach($Member in $_.GroupMembers) {
                    if($Member -and ($Member.Trim() -ne '')) {
                        if($Member -notmatch '^S-1-.*') {
                            # if the resulting member is username and not a SID, attempt to resolve it
                            $MemberSID = Convert-NameToSid -Domain $Domain -ObjectName $Member | Select-Object -ExpandProperty SID
                            if($MemberSID) {
                                $GroupMembers += $MemberSID
                            }
                            else {
                                $GroupMembers += $Member
                            }
                        }
                        else {
                            $GroupMembers += $Member
                        }
                    }
                }
                $_.GroupMembers = $GroupMembers
            }

            $_ | Add-Member Noteproperty 'GPODisplayName' $GPODisplayName
            $_ | Add-Member Noteproperty 'GPOName' $GPOName
            $_ | Add-Member Noteproperty 'GPOType' 'GroupPolicyPreferences'
            $_
        }
    }
}


function Find-GPOLocation {
<#
    .SYNOPSIS

        Enumerates the machines where a specific user/group is a member of a specific
        local group, all through GPO correlation.

        Author: @harmj0y
        License: BSD 3-Clause
        Required Dependencies: Get-NetGPOGroup, Get-NetOU, Get-NetComputer, Get-ADObject, Get-NetSite
        Optional Dependencies: None

    .DESCRIPTION

        Takes a user/group name and optional domain, and determines the computers in the domain
        the user/group has local admin (or RDP) rights to.

        It does this by:
            1.  resolving the user/group to its proper SID
            2.  enumerating all groups the user/group is a current part of
                and extracting all target SIDs to build a target SID list
            3.  pulling all GPOs that set 'Restricted Groups' or Groups.xml by calling
                Get-NetGPOGroup
            4.  matching the target SID list to the queried GPO SID list
                to enumerate all GPO the user is effectively applied with
            5.  enumerating all OUs and sites and applicable GPO GUIs are
                applied to through gplink enumerating
            6.  querying for all computers under the given OUs or sites

        If no user/group is specified, all user/group -> machine mappings discovered through
        GPO relationships are returned.

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

        PS C:\> Find-GPOLocation

        Find all user/group -> machine relationships where the user/group is a member
        of the local administrators group on target machines.

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

    $TargetSIDs = @('*')

    # figure out what the SID is of the target local group we're checking for membership in
    if($LocalGroup -like "*Admin*") {
        $TargetLocalSID = 'S-1-5-32-544'
    }
    elseif ( ($LocalGroup -like "*RDP*") -or ($LocalGroup -like "*Remote*") ) {
        $TargetLocalSID = 'S-1-5-32-555'
    }
    elseif ($LocalGroup -like "S-1-5-*") {
        $TargetLocalSID = $LocalGroup
    }
    else {
        throw "LocalGroup must be 'Administrators', 'RDP', or a 'S-1-5-X' SID format."
    }

    if(-not $TargetSIDs) {
        throw "No effective target SIDs!"
    }

    Write-Verbose "TargetLocalSID: $TargetLocalSID"
    Write-Verbose "Effective target SIDs: $TargetSIDs"

    $GPOGroupArgs =  @{
        'Domain' = $Domain
        'DomainController' = $DomainController
        'UsePSDrive' = $UsePSDrive
        'ResolveMemberSIDs' = $True
        'PageSize' = $PageSize
    }

    # enumerate all GPO group mappings for the target domain that involve our target SID set
    Sort-Object -Property GPOName -Unique -InputObject $(ForEach($GPOGroup in (Get-NetGPOGroup @GPOGroupArgs)) {
        # if the locally set group is what we're looking for, check the GroupMembers ('members')
        #    for our target SID
        if($GPOgroup.GroupSID -match $TargetLocalSID) {
            ForEach($GPOgroupMember in $GPOgroup.GroupMembers) {
                if($GPOgroupMember) {
                    if ( ($TargetSIDs[0] -eq '*') -or ($TargetSIDs -Contains $GPOgroupMember) ) {
                        $GPOgroup
                    }
                }
            }
        }
        # if the group is a 'memberof' the group we're looking for, check GroupSID against the targt SIDs
        if( ($GPOgroup.GroupMemberOf -contains $TargetLocalSID) ) {
            if( ($TargetSIDs[0] -eq '*') -or ($TargetSIDs -Contains $GPOgroup.GroupSID) ) {
                $GPOgroup
            }
        }
    }) | ForEach-Object {

        $GPOname = $_.GPODisplayName
        write-verbose "GPOname: $GPOname"
        $GPOguid = $_.GPOName
        $GPOPath = $_.GPOPath
        $GPOType = $_.GPOType
        if($_.GroupMembers) {
            $GPOMembers = $_.GroupMembers
        }
        else {
            $GPOMembers = $_.GroupSID
        }

        $Filters = $_.Filters

        if(-not $TargetObject) {
            # if the * wildcard was used, set the ObjectDistName as the GPO member SID set
            #   so all relationship mappings are output
            $TargetObjectSIDs = $GPOMembers
        }
        else {
            $TargetObjectSIDs = $TargetObject
        }

        # find any OUs that have this GUID applied and then retrieve any computers from the OU
        Get-NetOU -Domain $Domain -DomainController $DomainController -GUID $GPOguid -FullData -PageSize $PageSize | ForEach-Object {
            if($Filters) {
                # filter for computer name/org unit if a filter is specified
                #   TODO: handle other filters (i.e. OU filters?) again, I hate you GPP...
                $FilterValue = $Filters.Value
                $OUComputers = ForEach($OUComputer in (Get-NetComputer -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $_.ADSpath -PageSize $PageSize)) {
                    if($OUComputer.ToLower() -match $Filters.Value) {
                        $OUComputer
                    }
                }
            }
            else {
                $OUComputers = Get-NetComputer -Domain $Domain -DomainController $DomainController -Credential $Credential -ADSpath $_.ADSpath -PageSize $PageSize
            }

            if($OUComputers) {
                if($OUComputers -isnot [System.Array]) {$OUComputers = @($OUComputers)}
                ForEach ($TargetSid in $TargetObjectSIDs) {
                    $Object = Get-ADObject -SID $TargetSid
                    if (-not $Object) {
                        $Object = Get-ADObject -SID $TargetSid -Domain $Domain -DomainController $DomainController -Credential $Credential -PageSize $PageSize
                    }
                    if($Object) {
                        $MemberDN = $Object.distinguishedName
                        $ObjectDomain = $MemberDN.subString($MemberDN.IndexOf("DC=")) -replace 'DC=','' -replace ',','.'
                        $IsGroup = @('268435456','268435457','536870912','536870913') -contains $Object.samaccounttype

                        $GPOLocation = New-Object PSObject
                        $GPOLocation | Add-Member Noteproperty 'ObjectDomain' $ObjectDomain
                        $GPOLocation | Add-Member Noteproperty 'ObjectName' $Object.samaccountname
                        $GPOLocation | Add-Member Noteproperty 'ObjectDN' $Object.distinguishedname
                        $GPOLocation | Add-Member Noteproperty 'ObjectSID' $Object.objectsid
                        $GPOLocation | Add-Member Noteproperty 'IsGroup' $IsGroup
                        $GPOLocation | Add-Member Noteproperty 'GPODomain' $Domain
                        $GPOLocation | Add-Member Noteproperty 'GPODisplayName' $GPOname
                        $GPOLocation | Add-Member Noteproperty 'GPOGuid' $GPOGuid
                        $GPOLocation | Add-Member Noteproperty 'GPOPath' $GPOPath
                        $GPOLocation | Add-Member Noteproperty 'GPOType' $GPOType
                        $GPOLocation | Add-Member Noteproperty 'ContainerName' $_.distinguishedname
                        $GPOLocation | Add-Member Noteproperty 'ComputerName' $OUComputers
                        $GPOLocation.PSObject.TypeNames.Add('PowerView.GPOLocalGroup')
                        $GPOLocation
                    }
                }
            }
        }

        # find any sites that have this GUID applied
        Get-NetSite -Domain $Domain -DomainController $DomainController -GUID $GPOguid -PageSize $PageSize -FullData | ForEach-Object {

            ForEach ($TargetSid in $TargetObjectSIDs) {
                # $Object = Get-ADObject -SID $TargetSid -Domain $Domain -DomainController $DomainController -Credential $Credential -PageSize $PageSize
                $Object = Get-ADObject -SID $TargetSid
                if (-not $Object) {
                    $Object = Get-ADObject -SID $TargetSid -Domain $Domain -DomainController $DomainController -Credential $Credential -PageSize $PageSize                        
                }
                if($Object) {
                    $MemberDN = $Object.distinguishedName
                    $ObjectDomain = $MemberDN.subString($MemberDN.IndexOf("DC=")) -replace 'DC=','' -replace ',','.'
                    $IsGroup = @('268435456','268435457','536870912','536870913') -contains $Object.samaccounttype

                    $AppliedSite = New-Object PSObject
                    $GPOLocation | Add-Member Noteproperty 'ObjectDomain' $ObjectDomain
                    $AppliedSite | Add-Member Noteproperty 'ObjectName' $Object.samaccountname
                    $AppliedSite | Add-Member Noteproperty 'ObjectDN' $Object.distinguishedname
                    $AppliedSite | Add-Member Noteproperty 'ObjectSID' $Object.objectsid
                    $AppliedSite | Add-Member Noteproperty 'IsGroup' $IsGroup
                    $AppliedSite | Add-Member Noteproperty 'GPODomain' $Domain
                    $AppliedSite | Add-Member Noteproperty 'GPODisplayName' $GPOname
                    $AppliedSite | Add-Member Noteproperty 'GPOGuid' $GPOGuid
                    $AppliedSite | Add-Member Noteproperty 'GPOPath' $GPOPath
                    $AppliedSite | Add-Member Noteproperty 'GPOType' $GPOType
                    $AppliedSite | Add-Member Noteproperty 'ContainerName' $_.distinguishedname
                    $AppliedSite | Add-Member Noteproperty 'ComputerName' $_.siteobjectbl
                    $AppliedSite.PSObject.TypeNames.Add('PowerView.GPOLocalGroup')
                    $AppliedSite
                }
            }
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

    .PARAMETER Recurse

        Switch. If the local member member is a domain group, recursively try to resolve its members to get a list of domain users who can access this machine.

    .PARAMETER API

        Switch. Use API calls instead of the WinNT service provider. Less information,
        but the results are faster.

    .PARAMETER IsDomain

        Switch. Only return results that are domain accounts.

    .PARAMETER DomainSID

        The SID of the enumerated machine's domain, used to identify if results are domain
        or local when using the -API flag.

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
        $ComputerName = $Env:ComputerName,

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

        [Parameter(ParameterSetName = 'API')]
        [Switch]
        $API,

        [Switch]
        $IsDomain,

        [ValidateNotNullOrEmpty()]
        [String]
        $DomainSID
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
                # if we're using the Netapi32 NetLocalGroupGetMembers API call to get the local group information

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

                $LocalUsers = @()

                # 0 = success
                if (($Result -eq 0) -and ($Offset -gt 0)) {

                    # Work out how mutch to increment the pointer by finding out the size of the structure
                    $Increment = $LOCALGROUP_MEMBERS_INFO_2::GetSize()

                    # parse all the result structures
                    for ($i = 0; ($i -lt $EntriesRead); $i++) {
                        # create a new int ptr at the given offset and cast the pointer as our result structure
                        $NewIntPtr = New-Object System.Intptr -ArgumentList $Offset
                        $Info = $NewIntPtr -as $LOCALGROUP_MEMBERS_INFO_2

                        $Offset = $NewIntPtr.ToInt64()
                        $Offset += $Increment

                        $SidString = ''
                        $Result2 = $Advapi32::ConvertSidToStringSid($Info.lgrmi2_sid, [ref]$SidString);$LastError = [Runtime.InteropServices.Marshal]::GetLastWin32Error()

                        if($Result2 -eq 0) {
                            # error?
                        }
                        else {
                            $IsGroup = $($Info.lgrmi2_sidusage -ne 'SidTypeUser')
                            $LocalUsers += @{
                                'ComputerName' = $Server
                                'AccountName' = $Info.lgrmi2_domainandname
                                'SID' = $SidString
                                'IsGroup' = $IsGroup
                                'Type' = 'LocalUser'
                            }
                        }
                    }

                    # free up the result buffer
                    $Null = $Netapi32::NetApiBufferFree($PtrInfo)

                    $MachineSid = ($LocalUsers | Where-Object {$_['SID'] -like '*-500'})['SID']
                    $MachineSid = $MachineSid.Substring(0, $MachineSid.LastIndexOf('-'))
                    try {
                        ForEach($LocalUser in $LocalUsers) {
                            if($DomainSID -and ($LocalUser['SID'] -match $DomainSID)) {
                                $LocalUser['IsDomain'] = $True
                            }
                            elseif($LocalUser['SID'] -match $MachineSid) {
                                $LocalUser['IsDomain'] = $False
                            }
                            else {
                                $LocalUser['IsDomain'] = $True
                            }
                            if($IsDomain) {
                                if($LocalUser['IsDomain']) {
                                    $LocalUser
                                }
                            }
                            else {
                                $LocalUser
                            }
                        }
                    }
                    catch { }
                }
                else {
                    # error
                }
            }

            else {
                # otherwise we're using the WinNT service provider
                try {
                    $LocalUsers = @()
                    $Members = @($([ADSI]"WinNT://$Server/$GroupName,group").psbase.Invoke('Members'))

                    $Members | ForEach-Object {
                        $LocalUser = ([ADSI]$_)

                        $AdsPath = $LocalUser.InvokeGet('AdsPath').Replace('WinNT://', '')

                        if(([regex]::Matches($AdsPath, '/')).count -eq 1) {
                            # DOMAIN\user
                            $MemberIsDomain = $True
                            $Name = $AdsPath.Replace('/', '\')
                        }
                        else {
                            # DOMAIN\machine\user
                            $MemberIsDomain = $False
                            $Name = $AdsPath.Substring($AdsPath.IndexOf('/')+1).Replace('/', '\')
                        }

                        $IsGroup = ($LocalUser.SchemaClassName -like 'group')
                        if($IsDomain) {
                            if($MemberIsDomain) {
                                $LocalUsers += @{
                                    'ComputerName' = $Server
                                    'AccountName' = $Name
                                    'SID' = ((New-Object System.Security.Principal.SecurityIdentifier($LocalUser.InvokeGet('ObjectSID'),0)).Value)
                                    'IsGroup' = $IsGroup
                                    'IsDomain' = $MemberIsDomain
                                    'Type' = 'LocalUser'
                                }
                            }
                        }
                        else {
                            $LocalUsers += @{
                                'ComputerName' = $Server
                                'AccountName' = $Name
                                'SID' = ((New-Object System.Security.Principal.SecurityIdentifier($LocalUser.InvokeGet('ObjectSID'),0)).Value)
                                'IsGroup' = $IsGroup
                                'IsDomain' = $MemberIsDomain
                                'Type' = 'LocalUser'
                            }
                        }
                    }
                    $LocalUsers
                }
                catch {
                    Write-Verbose "Get-NetLocalGroup error for $Server : $_"
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

    # 0 = success
    if (($Result -eq 0) -and ($Offset -gt 0)) {

        # Work out how mutch to increment the pointer by finding out the size of the structure
        $Increment = $WKSTA_USER_INFO_1::GetSize()

        # parse all the result structures
        for ($i = 0; ($i -lt $EntriesRead); $i++) {
            # create a new int ptr at the given offset and cast the pointer as our result structure
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
    else {
        Write-Verbose "Error: $(([ComponentModel.Win32Exception] $Result).Message)"
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

    # 0 = success
    if (($Result -eq 0) -and ($Offset -gt 0)) {

        # Work out how mutch to increment the pointer by finding out the size of the structure
        $Increment = $SESSION_INFO_10::GetSize()

        # parse all the result structures
        for ($i = 0; ($i -lt $EntriesRead); $i++) {
            # create a new int ptr at the given offset and cast the pointer as our result structure
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
    else {
        Write-Verbose "Error: $(([ComponentModel.Win32Exception] $Result).Message)"
    }
}


filter Get-LoggedOnLocal {
<#
    .SYNOPSIS

        This function will query the HKU registry values to retrieve the local
        logged on users SID and then attempt and reverse it.
        Adapted technique from Sysinternal's PSLoggedOn script. Benefit over
        using the NetWkstaUserEnum API (Get-NetLoggedon) of less user privileges
        required (NetWkstaUserEnum requires remote admin access).

        Note: This function requires only domain user rights on the
        machine you're enumerating, but remote registry must be enabled.

        Function: Get-LoggedOnLocal
        Author: Matt Kelly, @BreakersAll

    .PARAMETER ComputerName

        The ComputerName to query for active sessions.

    .EXAMPLE

        PS C:\> Get-LoggedOnLocal

        Returns active sessions on the local host.

    .EXAMPLE

        PS C:\> Get-LoggedOnLocal -ComputerName sqlserver

        Returns active sessions on the 'sqlserver' host.

#>

    [CmdletBinding()]
    param(
        [Parameter(ValueFromPipeline=$True)]
        [Alias('HostName')]
        [Object[]]
        [ValidateNotNullOrEmpty()]
        $ComputerName = 'localhost'
    )

    # process multiple host object types from the pipeline
    $ComputerName = Get-NameField -Object $ComputerName

    try {
        # retrieve HKU remote registry values
        $Reg = [Microsoft.Win32.RegistryKey]::OpenRemoteBaseKey('Users', "$ComputerName")

        # sort out bogus sid's like _class
        $Reg.GetSubKeyNames() | Where-Object { $_ -match 'S-1-5-21-[0-9]+-[0-9]+-[0-9]+-[0-9]+$' } | ForEach-Object {
            $UserName = Convert-SidToName $_

            $Parts = $UserName.Split('\')
            $UserDomain = $Null
            $UserName = $Parts[-1]
            if ($Parts.Length -eq 2) {
                $UserDomain = $Parts[0]
            }

            $LocalLoggedOnUser = New-Object PSObject
            $LocalLoggedOnUser | Add-Member Noteproperty 'ComputerName' "$ComputerName"
            $LocalLoggedOnUser | Add-Member Noteproperty 'UserDomain' $UserDomain
            $LocalLoggedOnUser | Add-Member Noteproperty 'UserName' $UserName
            $LocalLoggedOnUser | Add-Member Noteproperty 'UserSID' $_
            $LocalLoggedOnUser
        }
    }
    catch { }
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

    .PARAMETER ADSpath

        The LDAP source to search through, e.g. "LDAP://DC=testlab,DC=local".
        Useful for global catalog queries ;)

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
        [Parameter(Position=0, ValueFromPipeline=$True)]
        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        $ADSpath,

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

    begin {
        $TrustAttributes = @{
            [uint32]'0x00000001' = 'non_transitive'
            [uint32]'0x00000002' = 'uplevel_only'
            [uint32]'0x00000004' = 'quarantined_domain'
            [uint32]'0x00000008' = 'forest_transitive'
            [uint32]'0x00000010' = 'cross_organization'
            [uint32]'0x00000020' = 'within_forest'
            [uint32]'0x00000040' = 'treat_as_external'
            [uint32]'0x00000080' = 'trust_uses_rc4_encryption'
            [uint32]'0x00000100' = 'trust_uses_aes_keys'
            [uint32]'0x00000200' = 'cross_organization_no_tgt_delegation'
            [uint32]'0x00000400' = 'pim_trust'
        }
    }

    process {

        if(-not $Domain) {
            # if not domain is specified grab the current domain
            $SourceDomain = (Get-NetDomain -Credential $Credential).Name
        }
        else {
            $SourceDomain = $Domain
        }

        if($LDAP -or $ADSPath) {

            $TrustSearcher = Get-DomainSearcher -Domain $SourceDomain -DomainController $DomainController -Credential $Credential -PageSize $PageSize -ADSpath $ADSpath

            $SourceSID = Get-DomainSID -Domain $SourceDomain -DomainController $DomainController

            if($TrustSearcher) {

                $TrustSearcher.Filter = '(objectClass=trustedDomain)'

                $Results = $TrustSearcher.FindAll()
                $Results | Where-Object {$_} | ForEach-Object {
                    $Props = $_.Properties
                    $DomainTrust = New-Object PSObject

                    $TrustAttrib = @()
                    $TrustAttrib += $TrustAttributes.Keys | Where-Object { $Props.trustattributes[0] -band $_ } | ForEach-Object { $TrustAttributes[$_] }

                    $Direction = Switch ($Props.trustdirection) {
                        0 { 'Disabled' }
                        1 { 'Inbound' }
                        2 { 'Outbound' }
                        3 { 'Bidirectional' }
                    }
                    $ObjectGuid = New-Object Guid @(,$Props.objectguid[0])
                    $TargetSID = (New-Object System.Security.Principal.SecurityIdentifier($Props.securityidentifier[0],0)).Value
                    $DomainTrust | Add-Member Noteproperty 'SourceName' $SourceDomain
                    $DomainTrust | Add-Member Noteproperty 'SourceSID' $SourceSID
                    $DomainTrust | Add-Member Noteproperty 'TargetName' $Props.name[0]
                    $DomainTrust | Add-Member Noteproperty 'TargetSID' $TargetSID
                    $DomainTrust | Add-Member Noteproperty 'ObjectGuid' "{$ObjectGuid}"
                    $DomainTrust | Add-Member Noteproperty 'TrustType' $($TrustAttrib -join ',')
                    $DomainTrust | Add-Member Noteproperty 'TrustDirection' "$Direction"
                    $DomainTrust.PSObject.TypeNames.Add('PowerView.DomainTrustLDAP')
                    $DomainTrust
                }
                $Results.dispose()
                $TrustSearcher.dispose()
            }
        }
        elseif($API) {
            if(-not $DomainController) {
                $DomainController = Get-NetDomainController -Credential $Credential -Domain $SourceDomain | Select-Object -First 1 | Select-Object -ExpandProperty Name
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

                # 0 = success
                if (($Result -eq 0) -and ($Offset -gt 0)) {

                    # Work out how mutch to increment the pointer by finding out the size of the structure
                    $Increment = $DS_DOMAIN_TRUSTS::GetSize()

                    # parse all the result structures
                    for ($i = 0; ($i -lt $DomainCount); $i++) {
                        # create a new int ptr at the given offset and cast the pointer as our result structure
                        $NewIntPtr = New-Object System.Intptr -ArgumentList $Offset
                        $Info = $NewIntPtr -as $DS_DOMAIN_TRUSTS

                        $Offset = $NewIntPtr.ToInt64()
                        $Offset += $Increment

                        $SidString = ""
                        $Result = $Advapi32::ConvertSidToStringSid($Info.DomainSid, [ref]$SidString);$LastError = [Runtime.InteropServices.Marshal]::GetLastWin32Error()

                        if($Result -eq 0) {
                            Write-Verbose "Error: $(([ComponentModel.Win32Exception] $LastError).Message)"
                        }
                        else {
                            $DomainTrust = New-Object PSObject
                            $DomainTrust | Add-Member Noteproperty 'SourceDomain' $SourceDomain
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
                else {
                    Write-Verbose "Error: $(([ComponentModel.Win32Exception] $Result).Message)"
                }
            }
            else {
                Write-Verbose "Could not retrieve domain controller for $Domain"
            }
        }
        else {
            # if we're using direct domain connections through .NET
            $FoundDomain = Get-NetDomain -Domain $Domain -Credential $Credential
            if($FoundDomain) {
                $FoundDomain.GetAllTrustRelationships() | ForEach-Object {
                    $_.PSObject.TypeNames.Add('PowerView.DomainTrust')
                    $_
                }
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
            $FoundForest.GetAllTrustRelationships() | ForEach-Object {
                $_.PSObject.TypeNames.Add('PowerView.ForestTrust')
                $_
            }
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

                if($Trusts -isnot [System.Array]) {
                    $Trusts = @($Trusts)
                }

                # get any forest trusts, if they exist
                if(-not ($LDAP -or $DomainController) ) {
                    $Trusts += Get-NetForestTrust -Forest $Domain -Credential $Credential
                }

                if ($Trusts) {
                    if($Trusts -isnot [System.Array]) {
                        $Trusts = @($Trusts)
                    }

                    # enumerate each trust found
                    ForEach ($Trust in $Trusts) {
                        if($Trust.SourceName -and $Trust.TargetName) {
                            $SourceDomain = $Trust.SourceName
                            $TargetDomain = $Trust.TargetName
                            $TrustType = $Trust.TrustType
                            $TrustDirection = $Trust.TrustDirection
                            $ObjectType = $Trust.PSObject.TypeNames | Where-Object {$_ -match 'PowerView'} | Select-Object -First 1

                            # make sure we process the target
                            $Null = $Domains.Push($TargetDomain)

                            # build the nicely-parsable custom output object
                            $DomainTrust = New-Object PSObject
                            $DomainTrust | Add-Member Noteproperty 'SourceDomain' "$SourceDomain"
                            $DomainTrust | Add-Member Noteproperty 'SourceSID' $Trust.SourceSID
                            $DomainTrust | Add-Member Noteproperty 'TargetDomain' "$TargetDomain"
                            $DomainTrust | Add-Member Noteproperty 'TargetSID' $Trust.TargetSID
                            $DomainTrust | Add-Member Noteproperty 'TrustType' "$TrustType"
                            $DomainTrust | Add-Member Noteproperty 'TrustDirection' "$TrustDirection"
                            $DomainTrust.PSObject.TypeNames.Add($ObjectType)
                            $DomainTrust
                        }
                    }
                }
            }
            catch {
                Write-Verbose "[!] Error: $_"
            }
        }
    }
}


########################################################
#
# BloodHound specific fuctions.
#
########################################################

function New-ThreadedFunction {
    # Helper used by any threaded host enumeration functions
    [CmdletBinding()]
    Param(
        [Parameter(Position = 0, Mandatory = $True, ValueFromPipeline = $True, ValueFromPipelineByPropertyName = $True)]
        [String[]]
        $ComputerName,

        [Parameter(Position = 1, Mandatory = $True)]
        [System.Management.Automation.ScriptBlock]
        $ScriptBlock,

        [Parameter(Position = 2)]
        [Hashtable]
        $ScriptParameters,

        [Int]
        [ValidateRange(1,  100)]
        $Threads = 20,

        [Switch]
        $NoImports
    )

    BEGIN {
        # Adapted from:
        #   http://powershell.org/wp/forums/topic/invpke-parallel-need-help-to-clone-the-current-runspace/
        $SessionState = [System.Management.Automation.Runspaces.InitialSessionState]::CreateDefault()
        $SessionState.ApartmentState = [System.Threading.Thread]::CurrentThread.GetApartmentState()

        # import the current session state's variables and functions so the chained PowerView
        #   functionality can be used by the threaded blocks
        if (-not $NoImports) {
            # grab all the current variables for this runspace
            $MyVars = Get-Variable -Scope 2

            # these Variables are added by Runspace.Open() Method and produce Stop errors if you add them twice
            $VorbiddenVars = @('?','args','ConsoleFileName','Error','ExecutionContext','false','HOME','Host','input','InputObject','MaximumAliasCount','MaximumDriveCount','MaximumErrorCount','MaximumFunctionCount','MaximumHistoryCount','MaximumVariableCount','MyInvocation','null','PID','PSBoundParameters','PSCommandPath','PSCulture','PSDefaultParameterValues','PSHOME','PSScriptRoot','PSUICulture','PSVersionTable','PWD','ShellId','SynchronizedHash','true')

            # add Variables from Parent Scope (current runspace) into the InitialSessionState
            ForEach ($Var in $MyVars) {
                if ($VorbiddenVars -NotContains $Var.Name) {
                $SessionState.Variables.Add((New-Object -TypeName System.Management.Automation.Runspaces.SessionStateVariableEntry -ArgumentList $Var.name,$Var.Value,$Var.description,$Var.options,$Var.attributes))
                }
            }

            # add Functions from current runspace to the InitialSessionState
            ForEach ($Function in (Get-ChildItem Function:)) {
                $SessionState.Commands.Add((New-Object -TypeName System.Management.Automation.Runspaces.SessionStateFunctionEntry -ArgumentList $Function.Name, $Function.Definition))
            }
        }

        # threading adapted from
        # https://github.com/darkoperator/Posh-SecMod/blob/master/Discovery/Discovery.psm1#L407
        #   Thanks Carlos!

        # create a pool of maxThread runspaces
        $Pool = [RunspaceFactory]::CreateRunspacePool(1, $Threads, $SessionState, $Host)
        $Pool.Open()

        # do some trickery to get the proper BeginInvoke() method that allows for an output queue
        $Method = $Null
        ForEach ($M in [PowerShell].GetMethods() | Where-Object { $_.Name -eq 'BeginInvoke' }) {
            $MethodParameters = $M.GetParameters()
            if (($MethodParameters.Count -eq 2) -and $MethodParameters[0].Name -eq 'input' -and $MethodParameters[1].Name -eq 'output') {
                $Method = $M.MakeGenericMethod([Object], [Object])
                break
            }
        }

        $Jobs = @()
        $ComputerName = $ComputerName | Where-Object { $_ -and ($_ -ne '') }
        Write-Verbose "[New-ThreadedFunction] Total number of hosts: $($ComputerName.count)"

        # partition all hosts from -ComputerName into $Threads number of groups 
        if ($Threads -ge $ComputerName.Length) {
            $Threads = $ComputerName.Length
        }
        $ElementSplitSize = [Int]($ComputerName.Length/$Threads)
        $ComputerNamePartitioned = @()
        $Start = 0
        $End = $ElementSplitSize

        for($i = 1; $i -le $Threads; $i++) {
            $List = New-Object System.Collections.ArrayList
            if ($i -eq $Threads) {
                $End = $ComputerName.Length
            }
            $List.AddRange($ComputerName[$Start..($End-1)])
            $Start += $ElementSplitSize
            $End += $ElementSplitSize
            $ComputerNamePartitioned += @(,@($List.ToArray()))
        }

        Write-Verbose "[New-ThreadedFunction] Total number of threads/partitions: $Threads"

        ForEach ($ComputerNamePartition in $ComputerNamePartitioned) {
            # create a "powershell pipeline runner"
            $PowerShell = [PowerShell]::Create()
            $PowerShell.runspacepool = $Pool

            # add the script block + arguments with the given computer partition
            $Null = $PowerShell.AddScript($ScriptBlock).AddParameter('ComputerName', $ComputerNamePartition)
            if ($ScriptParameters) {
                ForEach ($Param in $ScriptParameters.GetEnumerator()) {
                    $Null = $PowerShell.AddParameter($Param.Name, $Param.Value)
                }
            }

            # create the output queue
            $Output = New-Object Management.Automation.PSDataCollection[Object]

            # kick off execution using the BeginInvok() method that allows queues
            $Jobs += @{
                PS = $PowerShell
                Output = $Output
                Result = $Method.Invoke($PowerShell, @($Null, [Management.Automation.PSDataCollection[Object]]$Output))
            }
        }
    }

    END {
        Write-Verbose "[New-ThreadedFunction] Threads executing"
        
        # continuously loop through each job queue, consuming output as appropriate
        Do {
            ForEach ($Job in $Jobs) {
                $Job.Output.ReadAll()
            }
            Start-Sleep -Seconds 1
        }
        While (($Jobs | Where-Object { -not $_.Result.IsCompleted }).Count -gt 0)
        Write-Verbose "[New-ThreadedFunction] Waiting 120 seconds for final cleanup..."
        Start-Sleep -Seconds 120

        # cleanup- make sure we didn't miss anything
        ForEach ($Job in $Jobs) {
            $Job.Output.ReadAll()
            $Job.PS.Dispose()
        }

        $Pool.Dispose()
        Write-Verbose "[New-ThreadedFunction] all threads completed"
    }
}


function Get-GlobalCatalogUserMapping {
<#
    .SYNOPSIS

        Returns a hashtable for all users in the global catalog, format of {username->domain}.
        This is used for user session deconfliction in the Export-BloodHound* functions for
        when a user session doesn't have a login domain.

    .PARAMETER GlobalCatalog

        The global catalog location to resole user memberships from, form of GC://global.catalog.
#>
    [CmdletBinding()]
    param(
        [ValidatePattern('^GC://')]
        [String]
        $GlobalCatalog
    )

    if(-not $PSBoundParameters['GlobalCatalog']) {
        $GCPath = ([ADSI]'LDAP://RootDSE').dnshostname
        $ADSPath = "GC://$GCPath"
        Write-Verbose "Enumerated global catalog location: $ADSPath"
    }
    else {
        $ADSpath = $GlobalCatalog
    }

    $UserDomainMappings = @{}

    $UserSearcher = Get-DomainSearcher -ADSpath $ADSpath
    $UserSearcher.filter = '(samAccountType=805306368)'
    $UserSearcher.PropertiesToLoad.AddRange(('samaccountname','distinguishedname', 'cn', 'objectsid'))

    ForEach($User in $UserSearcher.FindAll()) {
        $UserName = $User.Properties['samaccountname'][0].ToUpper()
        $UserDN = $User.Properties['distinguishedname'][0]

        if($UserDN -and ($UserDN -ne '')) {
            if (($UserDN -match 'ForeignSecurityPrincipals') -and ($UserDN -match 'S-1-5-21')) {
                try {
                    if(-not $MemberSID) {
                        $MemberSID = $User.Properties['cn'][0]
                    }
                    $UserSid = (New-Object System.Security.Principal.SecurityIdentifier($User.Properties['objectsid'][0],0)).Value
                    $MemberSimpleName = Convert-SidToName -SID $UserSid | Convert-ADName -InputType 'NT4' -OutputType 'Canonical'
                    if($MemberSimpleName) {
                        $UserDomain = $MemberSimpleName.Split('/')[0]
                    }
                    else {
                        Write-Verbose "Error converting $UserDN"
                        $UserDomain = $Null
                    }
                }
                catch {
                    Write-Verbose "Error converting $UserDN"
                    $UserDomain = $Null
                }
            }
            else {
                # extract the FQDN from the Distinguished Name
                $UserDomain = ($UserDN.subString($UserDN.IndexOf('DC=')) -replace 'DC=','' -replace ',','.').ToUpper()
            }
            if($UserDomain) {
                if(-not $UserDomainMappings[$UserName]) {
                    $UserDomainMappings[$UserName] = @($UserDomain)
                }
                elseif($UserDomainMappings[$UserName] -notcontains $UserDomain) {
                    $UserDomainMappings[$UserName] += $UserDomain
                }
            }
        }
    }

    $UserSearcher.dispose()
    $UserDomainMappings
}


function Invoke-BloodHound {
<#
    .SYNOPSIS

        This function automates the collection of the data needed for BloodHound.

        Author: @harmj0y
        License: BSD 3-Clause
        Required Dependencies: None
        Optional Dependencies: None

    .DESCRIPTION

        This function collects the information needed to populate the BloodHound graph
        database. It offers a varity of targeting and collection options.
        By default, it will map all domain trusts, enumerate all groups and associated memberships,
        enumerate all computers on the domain and execute session/loggedon/local admin enumeration
        queries against each. Targeting options are modifiable with -CollectionMethod. The
        -SearchForest searches all domains in the forest instead of just the current domain.
        By default, the data is output to CSVs in the current folder location (old Export-BloodHoundCSV functionality).
        To modify this, use -CSVFolder. To export to a neo4j RESTful API interface, specify a
        -URI X and -UserPass "...".

    .PARAMETER ComputerName

        Array of one or more computers to enumerate.

    .PARAMETER ComputerADSpath

        The LDAP source to search through for computers, e.g. "LDAP://OU=secret,DC=testlab,DC=local".

    .PARAMETER UserADSpath

        The LDAP source to search through for users/groups, e.g. "LDAP://OU=secret,DC=testlab,DC=local".

    .PARAMETER Domain

        Domain to query for machines, defaults to the current domain.

    .PARAMETER DomainController

        Domain controller to bind to for queries.

    .PARAMETER CollectionMethod

        The method to collect data. 'Group', 'ComputerOnly', 'LocalGroup', 'GPOLocalGroup', 'Session', 'LoggedOn', 'Trusts, 'Stealth', or 'Default'.
        'Stealth' uses 'Group' collection, stealth user hunting ('Session' on certain servers), 'GPOLocalGroup' enumeration, and trust enumeration.
        'Default' uses 'Group' collection, regular user hunting with 'Session'/'LoggedOn', 'LocalGroup' enumeration, and 'Trusts' enumeration.
        'ComputerOnly' only enumerates computers, not groups/trusts, and executes local admin/session/loggedon on each.

    .PARAMETER SearchForest

        Switch. Search all domains in the forest for target users instead of just
        a single domain.

    .PARAMETER CSVFolder

        The CSV folder to use for output, defaults to the current folder location.

    .PARAMETER CSVPrefix

        A prefix for all CSV files.

    .PARAMETER URI

        The BloodHound neo4j URL location (http://host:port/).

    .PARAMETER UserPass

        The "user:password" for the BloodHound neo4j instance

   .PARAMETER GlobalCatalog

        The global catalog location to resolve user memberships from, form of GC://global.catalog.

    .PARAMETER SkipGCDeconfliction

        Switch. Skip global catalog enumeration for session deconfliction.

    .PARAMETER Threads

        The maximum concurrent threads to execute, default of 20.

    .PARAMETER Throttle

        The number of cypher queries to queue up for neo4j RESTful API ingestion.

    .EXAMPLE

        PS C:\> Invoke-BloodHound

        Executes default collection methods and exports the data to a CSVs in the current directory.

    .EXAMPLE

        PS C:\> Invoke-BloodHound -URI http://SERVER:7474/ -UserPass "user:pass"

        Executes default collection options and exports the data to a BloodHound neo4j RESTful API endpoint.

    .EXAMPLE

        PS C:\> Invoke-BloodHound -CollectionMethod stealth

        Executes stealth collection and exports the data to a CSVs in the current directory.
        This includes 'stealth' user hunting and GPO object correlation for local admin membership.
        This is significantly faster but the information is not as complete as the default options.

    .LINK

        http://neo4j.com/docs/stable/rest-api-batch-ops.html
        http://stackoverflow.com/questions/19839469/optimizing-high-volume-batch-inserts-into-neo4j-using-rest
#>

    [CmdletBinding(DefaultParameterSetName = 'CSVExport')]
    param(
        [Parameter(ValueFromPipeline=$True)]
        [Alias('HostName')]
        [String[]]
        [ValidateNotNullOrEmpty()]
        $ComputerName,

        [String]
        $ComputerADSpath,

        [String]
        $UserADSpath,

        [String]
        $Domain,

        [String]
        $DomainController,

        [String]
        [ValidateSet('Group', 'ACLs', 'ComputerOnly', 'LocalGroup', 'GPOLocalGroup', 'Session', 'LoggedOn', 'Stealth', 'Trusts', 'Default')]
        $CollectionMethod = 'Default',

        [Switch]
        $SearchForest,

        [Parameter(ParameterSetName = 'CSVExport')]
        [ValidateScript({ Test-Path -Path $_ })]
        [String]
        $CSVFolder = $(Get-Location),

        [Parameter(ParameterSetName = 'CSVExport')]
        [ValidateNotNullOrEmpty()]
        [String]
        $CSVPrefix,

        [Parameter(ParameterSetName = 'RESTAPI', Mandatory = $True)]
        [URI]
        $URI,

        [Parameter(ParameterSetName = 'RESTAPI', Mandatory = $True)]
        [String]
        [ValidatePattern('.*:.*')]
        $UserPass,

        [ValidatePattern('^GC://')]
        [String]
        $GlobalCatalog,

        [Switch]
        $SkipGCDeconfliction,

        [ValidateRange(1,50)]
        [Int]
        $Threads = 20,

        [ValidateRange(1,5000)]
        [Int]
        $Throttle = 1000
    )

    BEGIN {

        Switch ($CollectionMethod) {
            'Group'         { $UseGroup = $True; $SkipComputerEnumeration = $True; $SkipGCDeconfliction2 = $True }
            'ACLs'          { $UseGroup = $False; $SkipComputerEnumeration = $True; $SkipGCDeconfliction2 = $True; $UseACLs = $True }
            'ComputerOnly'  { $UseGroup = $False; $UseLocalGroup = $True; $UseSession = $True; $UseLoggedOn = $True; $SkipGCDeconfliction2 = $False }
            'LocalGroup'    { $UseLocalGroup = $True; $SkipGCDeconfliction2 = $True }
            'GPOLocalGroup' { $UseGPOGroup = $True; $SkipComputerEnumeration = $True; $SkipGCDeconfliction2 = $True }
            'Session'       { $UseSession = $True; $SkipGCDeconfliction2 = $False }
            'LoggedOn'      { $UseLoggedOn = $True; $SkipGCDeconfliction2 = $True }
            'Trusts'        { $UseDomainTrusts = $True; $SkipComputerEnumeration = $True; $SkipGCDeconfliction2 = $True }
            'Stealth'       {
                $UseGroup = $True
                $UseGPOGroup = $True
                $UseSession = $True
                $UseDomainTrusts = $True
                $SkipGCDeconfliction2 = $False
            }
            'Default'       {
                $UseGroup = $True
                $UseLocalGroup = $True
                $UseSession = $True
                $UseLoggedOn = $False
                $UseDomainTrusts = $True
                $SkipGCDeconfliction2 = $False
            }
        }

        if($SkipGCDeconfliction) {
            $SkipGCDeconfliction2 = $True
        }

        $GCPath = ([ADSI]'LDAP://RootDSE').dnshostname
        $GCADSPath = "GC://$GCPath"

        # the ActiveDirectoryRights regex we're using for output
        #   https://msdn.microsoft.com/en-us/library/system.directoryservices.activedirectoryrights(v=vs.110).aspx
        # $ACLRightsRegex = [regex] 'GenericAll|GenericWrite|WriteProperty|WriteOwner|WriteDacl|ExtendedRight'
        $ACLGeneralRightsRegex = [regex] 'GenericAll|GenericWrite|WriteOwner|WriteDacl'

        if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
            try {
                $OutputFolder = $CSVFolder | Resolve-Path -ErrorAction Stop | Select-Object -ExpandProperty Path
            }
            catch {
                throw "Error: $_"
            }

            if($CSVPrefix) {
                $CSVExportPrefix = "$($CSVPrefix)_"
            }
            else {
                $CSVExportPrefix = ''
            }

            Write-Output "Writing output to CSVs in: $OutputFolder\$CSVExportPrefix"

            if($UseSession -or $UseLoggedon) {
                $SessionPath = "$OutputFolder\$($CSVExportPrefix)user_sessions.csv"
                $Exists = [System.IO.File]::Exists($SessionPath)
                $SessionFileStream = New-Object IO.FileStream($SessionPath, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [IO.FileShare]::Read)
                $SessionWriter = New-Object System.IO.StreamWriter($SessionFileStream)
                $SessionWriter.AutoFlush = $True
                if (-not $Exists) {
                    # add the header if the file doesn't already exist
                    $SessionWriter.WriteLine('"ComputerName","UserName","Weight"')
                }
            }

            if($UseGroup) {
                $GroupPath = "$OutputFolder\$($CSVExportPrefix)group_memberships.csv"
                $Exists = [System.IO.File]::Exists($GroupPath)
                $GroupFileStream = New-Object IO.FileStream($GroupPath, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [IO.FileShare]::Read)
                $GroupWriter = New-Object System.IO.StreamWriter($GroupFileStream)
                $GroupWriter.AutoFlush = $True
                if (-not $Exists) {
                    # add the header if the file doesn't already exist
                    $GroupWriter.WriteLine('"GroupName","AccountName","AccountType"')
                }
            }

            if($UseACLs) {
                $ACLPath = "$OutputFolder\$($CSVExportPrefix)acls.csv"
                $Exists = [System.IO.File]::Exists($ACLPath)
                $ACLFileStream = New-Object IO.FileStream($ACLPath, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [IO.FileShare]::Read)
                $ACLWriter = New-Object System.IO.StreamWriter($ACLFileStream)
                $ACLWriter.AutoFlush = $True
                if (-not $Exists) {
                    # add the header if the file doesn't already exist
                    $ACLWriter.WriteLine('"ObjectName","ObjectType","PrincipalName","PrincipalType","ActiveDirectoryRights","ACEType","AccessControlType","IsInherited"')
                }
            }

            if($UseLocalGroup -or $UseGPOGroup) {
                $LocalAdminPath = "$OutputFolder\$($CSVExportPrefix)local_admins.csv"
                $Exists = [System.IO.File]::Exists($LocalAdminPath)
                $LocalAdminFileStream = New-Object IO.FileStream($LocalAdminPath, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [IO.FileShare]::Read)
                $LocalAdminWriter = New-Object System.IO.StreamWriter($LocalAdminFileStream)
                $LocalAdminWriter.AutoFlush = $True
                if (-not $Exists) {
                    # add the header if the file doesn't already exist
                    $LocalAdminWriter.WriteLine('"ComputerName","AccountName","AccountType"')
                }
            }

            if($UseDomainTrusts) {
                $TrustsPath = "$OutputFolder\$($CSVExportPrefix)trusts.csv"
                $Exists = [System.IO.File]::Exists($TrustsPath)
                $TrustsFileStream = New-Object IO.FileStream($TrustsPath, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [IO.FileShare]::Read)
                $TrustWriter = New-Object System.IO.StreamWriter($TrustsFileStream)
                $TrustWriter.AutoFlush = $True
                if (-not $Exists) {
                    # add the header if the file doesn't already exist
                    $TrustWriter.WriteLine('"SourceDomain","TargetDomain","TrustDirection","TrustType","Transitive"')
                }
            }
        }

        else {
            # otherwise we're doing ingestion straight to the neo4j RESTful API interface
            $WebClient = New-Object System.Net.WebClient

            $Base64UserPass = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($UserPass))

            # add the auth headers
            $WebClient.Headers.Add('Accept','application/json; charset=UTF-8')
            $WebClient.Headers.Add('Authorization',"Basic $Base64UserPass")

            # check auth to the BloodHound neo4j server
            try {
                $Null = $WebClient.DownloadString($URI.AbsoluteUri + 'user/neo4j')
                Write-Verbose "Connection established with neo4j ingestion interface at $($URI.AbsoluteUri)"
                $Authorized = $True
            }
            catch {
                $Authorized = $False
                throw "Error connecting to Neo4j rest REST server at '$($URI.AbsoluteUri)'"
            }

            Write-Output "Sending output to neo4j RESTful API interface at: $($URI.AbsoluteUri)"

            $Null = [Reflection.Assembly]::LoadWithPartialName("System.Web.Extensions")

            # from http://stackoverflow.com/questions/28077854/powershell-2-0-convertfrom-json-and-convertto-json-implementation
            function ConvertTo-Json20([object] $Item){
                $ps_js = New-Object System.Web.Script.Serialization.javascriptSerializer
                return $ps_js.Serialize($item)
            }

            $Authorized = $True
            $Statements = New-Object System.Collections.ArrayList

            # add in the necessary constraints on nodes
            $Null = $Statements.Add( @{ "statement"="CREATE CONSTRAINT ON (c:User) ASSERT c.UserName IS UNIQUE" } )
            $Null = $Statements.Add( @{ "statement"="CREATE CONSTRAINT ON (c:Computer) ASSERT c.ComputerName IS UNIQUE"} )
            $Null = $Statements.Add( @{ "statement"="CREATE CONSTRAINT ON (c:Group) ASSERT c.GroupName IS UNIQUE" } )
            $Json = @{ "statements"=[System.Collections.Hashtable[]]$Statements }
            $JsonRequest = ConvertTo-Json20 $Json
            $Null = $WebClient.UploadString($URI.AbsoluteUri + "db/data/transaction/commit", $JsonRequest)
            $Statements.Clear()
        }

        $UserDomainMappings = @{}
        if(-not $SkipGCDeconfliction2) {
            # if we're doing session enumeration, create a {user : @(domain,..)} from a global catalog
            #   in order to do user domain deconfliction for sessions
            if($PSBoundParameters['GlobalCatalog']) {
                $UserDomainMappings = Get-GlobalCatalogUserMapping -GlobalCatalog $GlobalCatalog
            }
            else {
                $UserDomainMappings = Get-GlobalCatalogUserMapping
            }
        }
        $DomainShortnameMappings = @{}

        if($Domain) {
            $TargetDomains = @($Domain)
        }
        elseif($SearchForest) {
            # get ALL the domains in the forest to search
            $TargetDomains = Get-NetForestDomain | Select-Object -ExpandProperty Name
        }
        else {
            # use the local domain
            $TargetDomains = @( (Get-NetDomain).Name )
        }

        if($UseGroup -and $TargetDomains) {
            $Title = (Get-Culture).TextInfo
            ForEach ($TargetDomain in $TargetDomains) {
                # enumerate all groups and all members of each group
                Write-Verbose "Enumerating group memberships for domain $TargetDomain"

                # in-line updated hashtable with group DN->SamAccountName mappings
                $GroupDNMappings = @{}
                $PrimaryGroups = @{}
                $DomainSID = Get-DomainSID -Domain $TargetDomain -DomainController $DomainController

                $ObjectSearcher = Get-DomainSearcher -Domain $TargetDomain -DomainController $DomainController -ADSPath $UserADSpath
                # only return results that have 'memberof' set
                $ObjectSearcher.Filter = '(memberof=*)'
                # only return specific properties in the results
                $Null = $ObjectSearcher.PropertiesToLoad.AddRange(('samaccountname', 'distinguishedname', 'cn', 'dnshostname', 'samaccounttype', 'primarygroupid', 'memberof'))
                $Counter = 0
                $ObjectSearcher.FindAll() | ForEach-Object {
                    if($Counter % 1000 -eq 0) {
                        Write-Verbose "Group object counter: $Counter"
                        if($GroupWriter) {
                            $GroupWriter.Flush()
                        }
                        [GC]::Collect()
                    }
                    $Properties = $_.Properties

                    $MemberDN = $Null
                    $MemberDomain = $Null
                    try {
                        $MemberDN = $Properties['distinguishedname'][0]

                        if (($MemberDN -match 'ForeignSecurityPrincipals') -and ($MemberDN -match 'S-1-5-21')) {
                            try {
                                if(-not $MemberSID) {
                                    $MemberSID = $Properties.cn[0]
                                }
                                $MemberSimpleName = Convert-SidToName -SID $MemberSID | Convert-ADName -InputType 'NT4' -OutputType 'Canonical'
                                if($MemberSimpleName) {
                                    $MemberDomain = $MemberSimpleName.Split('/')[0]
                                }
                                else {
                                    Write-Verbose "Error converting $MemberDN"
                                }
                            }
                            catch {
                                Write-Verbose "Error converting $MemberDN"
                            }
                        }
                        else {
                            # extract the FQDN from the Distinguished Name
                            $MemberDomain = $MemberDN.subString($MemberDN.IndexOf("DC=")) -replace 'DC=','' -replace ',','.'
                        }
                    }
                    catch {}

                    if (@('268435456','268435457','536870912','536870913') -contains $Properties['samaccounttype']) {
                        $ObjectType = 'group'
                        if($Properties['samaccountname']) {
                            $MemberName = $Properties['samaccountname'][0]
                        }
                        else {
                            # external trust users have a SID, so convert it
                            try {
                                $MemberName = Convert-SidToName $Properties['cn'][0]
                            }
                            catch {
                                # if there's a problem contacting the domain to resolve the SID
                                $MemberName = $Properties['cn'][0]
                            }
                        }
                        if ($MemberName -Match "\\") {
                            # if the membername itself contains a backslash, get the trailing section
                            #   TODO: later preserve this once BloodHound can properly display these characters
                            $AccountName = $MemberName.split('\')[1] + '@' + $MemberDomain
                        }
                        else {
                            $AccountName = "$MemberName@$MemberDomain"
                        }
                    }
                    elseif (@('805306369') -contains $Properties['samaccounttype']) {
                        $ObjectType = 'computer'
                        if ($Properties['dnshostname']) {
                            $AccountName = $Properties['dnshostname'][0]
                        }
                    }
                    elseif (@('805306368') -contains $Properties['samaccounttype']) {
                        $ObjectType = 'user'
                        if($Properties['samaccountname']) {
                            $MemberName = $Properties['samaccountname'][0]
                        }
                        else {
                            # external trust users have a SID, so convert it
                            try {
                                $MemberName = Convert-SidToName $Properties['cn'][0]
                            }
                            catch {
                                # if there's a problem contacting the domain to resolve the SID
                                $MemberName = $Properties['cn'][0]
                            }
                        }
                        if ($MemberName -Match "\\") {
                            # if the membername itself contains a backslash, get the trailing section
                            #   TODO: later preserve this once BloodHound can properly display these characters
                            $AccountName = $MemberName.split('\')[1] + '@' + $MemberDomain
                        }
                        else {
                            $AccountName = "$MemberName@$MemberDomain"
                        }
                    }
                    else {
                        Write-Verbose "Unknown account type for object $($Properties['distinguishedname']) : $($Properties['samaccounttype'])"
                    }

                    if($AccountName -and (-not $AccountName.StartsWith('@'))) {

                        # Write-Verbose "AccountName: $AccountName"
                        $MemberPrimaryGroupName = $Null
                        try {
                            if($AccountName -match $TargetDomain) {
                                # also retrieve the primary group name for this object, if it exists
                                if($Properties['primarygroupid'] -and $Properties['primarygroupid'][0] -and ($Properties['primarygroupid'][0] -ne '')) {
                                    $PrimaryGroupSID = "$DomainSID-$($Properties['primarygroupid'][0])"
                                    # Write-Verbose "PrimaryGroupSID: $PrimaryGroupSID"
                                    if($PrimaryGroups[$PrimaryGroupSID]) {
                                        $PrimaryGroupName = $PrimaryGroups[$PrimaryGroupSID]
                                    }
                                    else {
                                        $RawName = Convert-SidToName -SID $PrimaryGroupSID
                                        if ($RawName -notmatch '^S-1-.*') {
                                            $PrimaryGroupName = $RawName.split('\')[-1]
                                            $PrimaryGroups[$PrimaryGroupSID] = $PrimaryGroupName
                                        }
                                    }
                                    if ($PrimaryGroupName) {
                                        $MemberPrimaryGroupName = "$PrimaryGroupName@$TargetDomain"
                                    }
                                }
                                else { }
                            }
                        }
                        catch { }

                        if($MemberPrimaryGroupName) {
                            # Write-Verbose "MemberPrimaryGroupName: $MemberPrimaryGroupName"
                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $GroupWriter.WriteLine("`"$MemberPrimaryGroupName`",`"$AccountName`",`"$ObjectType`"")
                            }
                            else {
                                $ObjectTypeCap = $Title.ToTitleCase($ObjectType)
                                $Null = $Statements.Add( @{ "statement"="MERGE ($($ObjectType)1:$ObjectTypeCap { name: UPPER('$AccountName') }) MERGE (group2:Group { name: UPPER('$MemberPrimaryGroupName') }) MERGE ($($ObjectType)1)-[:MemberOf]->(group2)" } )
                            }
                        }

                        # iterate through each membership for this object
                        ForEach($GroupDN in $_.properties['memberof']) {
                            $GroupDomain = $GroupDN.subString($GroupDN.IndexOf('DC=')) -replace 'DC=','' -replace ',','.'

                            if($GroupDNMappings[$GroupDN]) {
                                $GroupName = $GroupDNMappings[$GroupDN]
                            }
                            else {
                                $GroupName = Convert-ADName -ObjectName $GroupDN
                                if($GroupName) {
                                    $GroupName = $GroupName.Split('\')[-1]
                                }
                                else {
                                    $GroupName = $GroupDN.SubString(0, $GroupDN.IndexOf(',')).Split('=')[-1]
                                }
                                $GroupDNMappings[$GroupDN] = $GroupName
                            }

                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $GroupWriter.WriteLine("`"$GroupName@$GroupDomain`",`"$AccountName`",`"$ObjectType`"")
                            }
                            else {
                                # otherwise we're exporting to the neo4j RESTful API
                                $ObjectTypeCap = $Title.ToTitleCase($ObjectType)

                                $Null = $Statements.Add( @{ "statement"="MERGE ($($ObjectType)1:$ObjectTypeCap { name: UPPER('$AccountName') }) MERGE (group2:Group { name: UPPER('$GroupName@$GroupDomain') }) MERGE ($($ObjectType)1)-[:MemberOf]->(group2)" } )

                                if ($Statements.Count -ge $Throttle) {
                                    $Json = @{ "statements"=[System.Collections.Hashtable[]]$Statements }
                                    $JsonRequest = ConvertTo-Json20 $Json
                                    $Null = $WebClient.UploadString($URI.AbsoluteUri + "db/data/transaction/commit", $JsonRequest)
                                    $Statements.Clear()
                                }
                            }
                        }
                        $Counter += 1
                    }
                }
                $ObjectSearcher.Dispose()

                if ($PSCmdlet.ParameterSetName -eq 'RESTAPI') {
                    $Json = @{ "statements"=[System.Collections.Hashtable[]]$Statements }
                    $JsonRequest = ConvertTo-Json20 $Json
                    $Null = $WebClient.UploadString($URI.AbsoluteUri + "db/data/transaction/commit", $JsonRequest)
                    $Statements.Clear()
                }
                Write-Verbose "Done with group enumeration for domain $TargetDomain"
            }
            [GC]::Collect()
        }

        if($UseACLs -and $TargetDomains) {

            # $PrincipalMapping format -> @{ PrincipalSID : @(PrincipalSimpleName, PrincipalObjectClass) }
            $PrincipalMapping = @{}
            $Counter = 0

            # #CommonSidMapping[SID] = @(name, objectClass)
            $CommonSidMapping = @{
                'S-1-0'         = @('Null Authority', 'USER')
                'S-1-0-0'       = @('Nobody', 'USER')
                'S-1-1'         = @('World Authority', 'USER')
                'S-1-1-0'       = @('Everyone', 'GROUP')
                'S-1-2'         = @('Local Authority', 'USER')
                'S-1-2-0'       = @('Local', 'GROUP')
                'S-1-2-1'       = @('Console Logon', 'GROUP')
                'S-1-3'         = @('Creator Authority', 'USER')
                'S-1-3-0'       = @('Creator Owner', 'USER')
                'S-1-3-1'       = @('Creator Group', 'GROUP')
                'S-1-3-2'       = @('Creator Owner Server', 'COMPUTER')
                'S-1-3-3'       = @('Creator Group Server', 'COMPUTER')
                'S-1-3-4'       = @('Owner Rights', 'GROUP')
                'S-1-4'         = @('Non-unique Authority', 'USER')
                'S-1-5'         = @('NT Authority', 'USER')
                'S-1-5-1'       = @('Dialup', 'GROUP')
                'S-1-5-2'       = @('Network', 'GROUP')
                'S-1-5-3'       = @('Batch', 'GROUP')
                'S-1-5-4'       = @('Interactive', 'GROUP')
                'S-1-5-6'       = @('Service', 'GROUP')
                'S-1-5-7'       = @('Anonymous', 'GROUP')
                'S-1-5-8'       = @('Proxy', 'GROUP')
                'S-1-5-9'       = @('Enterprise Domain Controllers', 'GROUP')
                'S-1-5-10'      = @('Principal Self', 'USER')
                'S-1-5-11'      = @('Authenticated Users', 'GROUP')
                'S-1-5-12'      = @('Restricted Code', 'GROUP')
                'S-1-5-13'      = @('Terminal Server Users', 'GROUP')
                'S-1-5-14'      = @('Remote Interactive Logon', 'GROUP')
                'S-1-5-15'      = @('This Organization ', 'GROUP')
                'S-1-5-17'      = @('This Organization ', 'GROUP')
                'S-1-5-18'      = @('Local System', 'USER')
                'S-1-5-19'      = @('NT Authority', 'USER')
                'S-1-5-20'      = @('NT Authority', 'USER')
                'S-1-5-80-0'    = @('All Services ', 'GROUP')
                'S-1-5-32-544'  = @('Administrators', 'GROUP')
                'S-1-5-32-545'  = @('Users', 'GROUP')
                'S-1-5-32-546'  = @('Guests', 'GROUP')
                'S-1-5-32-547'  = @('Power Users', 'GROUP')
                'S-1-5-32-548'  = @('Account Operators', 'GROUP')
                'S-1-5-32-549'  = @('Server Operators', 'GROUP')
                'S-1-5-32-550'  = @('Print Operators', 'GROUP')
                'S-1-5-32-551'  = @('Backup Operators', 'GROUP')
                'S-1-5-32-552'  = @('Replicators', 'GROUP')
                'S-1-5-32-554'  = @('Pre-Windows 2000 Compatible Access', 'GROUP')
                'S-1-5-32-555'  = @('Remote Desktop Users', 'GROUP')
                'S-1-5-32-556'  = @('Network Configuration Operators', 'GROUP')
                'S-1-5-32-557'  = @('Incoming Forest Trust Builders', 'GROUP')
                'S-1-5-32-558'  = @('Performance Monitor Users', 'GROUP')
                'S-1-5-32-559'  = @('Performance Log Users', 'GROUP')
                'S-1-5-32-560'  = @('Windows Authorization Access Group', 'GROUP')
                'S-1-5-32-561'  = @('Terminal Server License Servers', 'GROUP')
                'S-1-5-32-562'  = @('Distributed COM Users', 'GROUP')
                'S-1-5-32-569'  = @('Cryptographic Operators', 'GROUP')
                'S-1-5-32-573'  = @('Event Log Readers', 'GROUP')
                'S-1-5-32-574'  = @('Certificate Service DCOM Access', 'GROUP')
                'S-1-5-32-575'  = @('RDS Remote Access Servers', 'GROUP')
                'S-1-5-32-576'  = @('RDS Endpoint Servers', 'GROUP')
                'S-1-5-32-577'  = @('RDS Management Servers', 'GROUP')
                'S-1-5-32-578'  = @('Hyper-V Administrators', 'GROUP')
                'S-1-5-32-579'  = @('Access Control Assistance Operators', 'GROUP')
                'S-1-5-32-580'  = @('Access Control Assistance Operators', 'GROUP')
            }

            ForEach ($TargetDomain in $TargetDomains) {
                # enumerate all reachable user/group/computer objects and their associated ACLs
                Write-Verbose "Enumerating ACLs for objects in domain: $TargetDomain"

                $ObjectSearcher = Get-DomainSearcher -Domain $TargetDomain -DomainController $DomainController -ADSPath $UserADSpath
                $ObjectSearcher.SecurityMasks = [System.DirectoryServices.SecurityMasks]::Dacl

                # only enumerate user and group objects (for now)
                #   805306368 -> user
                #   805306369 -> computer
                #   268435456|268435457|536870912|536870913 -> groups
                $ObjectSearcher.Filter = '(|(samAccountType=805306368)(samAccountType=805306369)(samAccountType=268435456)(samAccountType=268435457)(samAccountType=536870912)(samAccountType=536870913))'
                $ObjectSearcher.PropertiesToLoad.AddRange(('distinguishedName','samaccountname','dnshostname','objectclass','objectsid','name', 'ntsecuritydescriptor'))

                $ObjectSearcher.FindAll() | ForEach-Object {
                    $Object = $_.Properties
                    if($Object -and $Object.distinguishedname -and $Object.distinguishedname[0] -and $Object.objectsid -and $Object.objectsid[0]) {

                        $ObjectSid = (New-Object System.Security.Principal.SecurityIdentifier($Object.objectsid[0],0)).Value

                        try {
                            # parse the 'ntsecuritydescriptor' field returned
                            New-Object -TypeName Security.AccessControl.RawSecurityDescriptor -ArgumentList $Object['ntsecuritydescriptor'][0], 0 | Select-Object -Expand DiscretionaryAcl | ForEach-Object {
                                $Counter += 1
                                if($Counter % 10000 -eq 0) {
                                    Write-Verbose "ACE counter: $Counter"
                                    if($ACLWriter) {
                                        $ACLWriter.Flush()
                                    }
                                    [GC]::Collect()
                                }

                                $RawActiveDirectoryRights = ([Enum]::ToObject([System.DirectoryServices.ActiveDirectoryRights], $_.AccessMask))

                                # check for the following rights:
                                #   GenericAll                      -   generic fully control of an object
                                #   GenericWrite                    -   write to any object properties
                                #   WriteDacl                       -   modify the permissions of the object
                                #   WriteOwner                      -   modify the owner of an object
                                #   User-Force-Change-Password      -   extended attribute (00299570-246d-11d0-a768-00aa006e0529)
                                #   WriteProperty/Self-Membership   -   modify group membership (bf9679c0-0de6-11d0-a285-00aa003049e2)
                                #   WriteProperty/Script-Path       -   modify a user's script-path (bf9679a8-0de6-11d0-a285-00aa003049e2)
                                if (
                                        ( ($RawActiveDirectoryRights -match 'GenericAll|GenericWrite') -and (-not $_.ObjectAceType -or $_.ObjectAceType -eq '00000000-0000-0000-0000-000000000000') ) -or 
                                        ($RawActiveDirectoryRights -match 'WriteDacl|WriteOwner') -or 
                                        ( ($RawActiveDirectoryRights -match 'ExtendedRight') -and (-not $_.ObjectAceType -or $_.ObjectAceType -eq '00000000-0000-0000-0000-000000000000') ) -or 
                                        (($_.ObjectAceType -eq '00299570-246d-11d0-a768-00aa006e0529') -and ($RawActiveDirectoryRights -match 'ExtendedRight')) -or
                                        (($_.ObjectAceType -eq 'bf9679c0-0de6-11d0-a285-00aa003049e2') -and ($RawActiveDirectoryRights -match 'WriteProperty')) -or
                                        (($_.ObjectAceType -eq 'bf9679a8-0de6-11d0-a285-00aa003049e2') -and ($RawActiveDirectoryRights -match 'WriteProperty'))
                                    ) {
                                    
                                    $PrincipalSid = $_.SecurityIdentifier.ToString()
                                    $PrincipalSimpleName, $PrincipalObjectClass, $ACEType = $Null

                                    # only grab the AD right names we care about
                                    #   'GenericAll|GenericWrite|WriteOwner|WriteDacl'
                                    $ActiveDirectoryRights = $ACLGeneralRightsRegex.Matches($RawActiveDirectoryRights) | Select-Object -ExpandProperty Value
                                    if (-not $ActiveDirectoryRights) {
                                        if ($RawActiveDirectoryRights -match 'ExtendedRight') {
                                            $ActiveDirectoryRights = 'ExtendedRight'
                                        }
                                        else {
                                            $ActiveDirectoryRights = 'WriteProperty'
                                        }

                                        # decode the ACE types here
                                        $ACEType = Switch ($_.ObjectAceType) {
                                            '00299570-246d-11d0-a768-00aa006e0529' {'User-Force-Change-Password'}
                                            'bf9679c0-0de6-11d0-a285-00aa003049e2' {'Member'}
                                            'bf9679a8-0de6-11d0-a285-00aa003049e2' {'Script-Path'}
                                            Default {'All'}
                                        }
                                    }

                                    if ($PrincipalMapping[$PrincipalSid]) {
                                        # Write-Verbose "$PrincipalSid in cache!"
                                        # $PrincipalMappings format -> @{ SID : @(PrincipalSimpleName, PrincipalObjectClass) }
                                        $PrincipalSimpleName, $PrincipalObjectClass = $PrincipalMapping[$PrincipalSid]
                                    }
                                    elseif ($CommonSidMapping[$PrincipalSid]) {
                                        # Write-Verbose "$PrincipalSid in common sids!"
                                        $PrincipalName, $PrincipalObjectClass = $CommonSidMapping[$PrincipalSid]
                                        $PrincipalSimpleName = "$PrincipalName@$TargetDomain"
                                        $PrincipalMapping[$PrincipalSid] = $PrincipalSimpleName, $PrincipalObjectClass
                                    }
                                    else {
                                        # Write-Verbose "$PrincipalSid NOT in cache!"
                                        # first try querying the target domain for this SID
                                        $SIDSearcher = Get-DomainSearcher -Domain $TargetDomain -DomainController $DomainController
                                        $SIDSearcher.PropertiesToLoad.AddRange(('samaccountname','distinguishedname','dnshostname','objectclass'))
                                        $SIDSearcher.Filter = "(objectsid=$PrincipalSid)"
                                        $PrincipalObject = $SIDSearcher.FindOne()

                                        if ((-not $PrincipalObject) -and ((-not $DomainController) -or (-not $DomainController.StartsWith('GC:')))) {
                                            # if the object didn't resolve from the current domain, attempt to query the global catalog
                                            $GCSearcher = Get-DomainSearcher -ADSpath $GCADSPath
                                            $GCSearcher.PropertiesToLoad.AddRange(('samaccountname','distinguishedname','dnshostname','objectclass'))
                                            $GCSearcher.Filter = "(objectsid=$PrincipalSid)"
                                            $PrincipalObject = $GCSearcher.FindOne()
                                        }

                                        if ($PrincipalObject) {
                                            if ($PrincipalObject.Properties.objectclass.contains('computer')) {
                                                $PrincipalObjectClass = 'COMPUTER'
                                                $PrincipalSimpleName = $PrincipalObject.Properties.dnshostname[0]
                                            }
                                            else {
                                                $PrincipalSamAccountName = $PrincipalObject.Properties.samaccountname[0]
                                                $PrincipalDN = $PrincipalObject.Properties.distinguishedname[0]
                                                $PrincipalDomain = $PrincipalDN.SubString($PrincipalDN.IndexOf('DC=')) -replace 'DC=','' -replace ',','.'
                                                $PrincipalSimpleName = "$PrincipalSamAccountName@$PrincipalDomain"

                                                if ($PrincipalObject.Properties.objectclass.contains('group')) {
                                                    $PrincipalObjectClass = 'GROUP'
                                                }
                                                elseif ($PrincipalObject.Properties.objectclass.contains('user')) {
                                                    $PrincipalObjectClass = 'USER'
                                                }
                                                else {
                                                    $PrincipalObjectClass = 'OTHER'
                                                }
                                            }
                                        }
                                        else {
                                            Write-Verbose "SID not resolved: $PrincipalSid"
                                        }

                                        $PrincipalMapping[$PrincipalSid] = $PrincipalSimpleName, $PrincipalObjectClass
                                    }

                                    if ($PrincipalSimpleName -and $PrincipalObjectClass) {
                                        $ObjectName, $ObjectADType = $Null

                                        if ($Object.objectclass.contains('computer')) {
                                            $ObjectADType = 'COMPUTER'
                                            if ($Object.dnshostname) {
                                                $ObjectName = $Object.dnshostname[0]
                                            }
                                        }
                                        else {
                                            if($Object.samaccountname) {
                                                $ObjectSamAccountName = $Object.samaccountname[0]
                                            }
                                            else {
                                                $ObjectSamAccountName = $Object.name[0]
                                            }
                                            $DN = $Object.distinguishedname[0]
                                            $ObjectDomain = $DN.SubString($DN.IndexOf('DC=')) -replace 'DC=','' -replace ',','.'
                                            $ObjectName = "$ObjectSamAccountName@$ObjectDomain"

                                            if ($Object.objectclass.contains('group')) {
                                                $ObjectADType = 'GROUP'
                                            }
                                            elseif ($Object.objectclass.contains('user')) {
                                                $ObjectADType = 'USER'
                                            }
                                            else {
                                                $ObjectADType = 'OTHER'
                                            }
                                        }

                                        if ($ObjectName -and $ObjectADType) {
                                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                                $ACLWriter.WriteLine("`"$ObjectName`",`"$ObjectADType`",`"$PrincipalSimpleName`",`"$PrincipalObjectClass`",`"$ActiveDirectoryRights`",`"$ACEType`",`"$($_.AceQualifier)`",`"$($_.IsInherited)`"")
                                            }
                                            else {
                                                Write-Warning 'TODO: implement neo4j RESTful API ingestion for ACLs!'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        catch {
                            Write-Verbose "ACL ingestion error: $_"
                        }
                    }
                }
            }
        }

        if($UseDomainTrusts -and $TargetDomains) {
            Write-Verbose "Mapping domain trusts"
            Invoke-MapDomainTrust | ForEach-Object {
                if($_.SourceDomain) {
                    $SourceDomain = $_.SourceDomain
                }
                else {
                    $SourceDomain = $_.SourceName
                }
                if($_.TargetDomain) {
                    $TargetDomain = $_.TargetDomain
                }
                else {
                    $TargetDomain = $_.TargetName
                }

                if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                    $TrustWriter.WriteLine("`"$SourceDomain`",`"$TargetDomain`",`"$($_.TrustDirection)`",`"$($_.TrustType)`",`"$True`"")
                }
                else {
                    $Null = $Statements.Add( @{ "statement"="MERGE (SourceDomain:Domain { name: UPPER('$SourceDomain') }) MERGE (TargetDomain:Domain { name: UPPER('$TargetDomain') })" } )

                    $TrustType = $_.TrustType
                    $Transitive = $True

                    Switch ($_.TrustDirection) {
                        'Inbound' {
                             $Null = $Statements.Add( @{ "statement"="MERGE (SourceDomain)-[:TrustedBy{ TrustType: UPPER('$TrustType'), Transitive: UPPER('$Transitive')}]->(TargetDomain)" } )
                        }
                        'Outbound' {
                             $Null = $Statements.Add( @{ "statement"="MERGE (TargetDomain)-[:TrustedBy{ TrustType: UPPER('$TrustType'), Transitive: UPPER('$Transitive')}]->(SourceDomain)" } )
                        }
                        'Bidirectional' {
                             $Null = $Statements.Add( @{ "statement"="MERGE (TargetDomain)-[:TrustedBy{ TrustType: UPPER('$TrustType'), Transitive: UPPER('$Transitive')}]->(SourceDomain) MERGE (SourceDomain)-[:TrustedBy{ TrustType: UPPER('$TrustType'), Transitive: UPPER('$Transitive')}]->(TargetDomain)" } )
                        }
                    }

                }
            }
            if ($PSCmdlet.ParameterSetName -eq 'RESTAPI') {
                $Json = @{ "statements"=[System.Collections.Hashtable[]]$Statements }
                $JsonRequest = ConvertTo-Json20 $Json
                $Null = $WebClient.UploadString($URI.AbsoluteUri + "db/data/transaction/commit", $JsonRequest)
                $Statements.Clear()
            }
            Write-Verbose "Done mapping domain trusts"
        }

        if($UseGPOGroup -and $TargetDomains) {
            ForEach ($TargetDomain in $TargetDomains) {

                Write-Verbose "Enumerating GPO local group memberships for domain $TargetDomain"
                Find-GPOLocation -Domain $TargetDomain -DomainController $DomainController | ForEach-Object {
                    $AccountName = "$($_.ObjectName)@$($_.ObjectDomain)"
                    ForEach($Computer in $_.ComputerName) {
                        if($_.IsGroup) {
                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $LocalAdminWriter.WriteLine("`"$Computer`",`"$AccountName`",`"group`"")
                            }
                            else {
                                $Null = $Statements.Add( @{"statement"="MERGE (group:Group { name: UPPER('$AccountName') }) MERGE (computer:Computer { name: UPPER('$Computer') }) MERGE (group)-[:AdminTo]->(computer)" } )
                            }
                        }
                        else {
                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $LocalAdminWriter.WriteLine("`"$Computer`",`"$AccountName`",`"user`"")
                            }
                            else {
                                $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$AccountName') }) MERGE (computer:Computer { name: UPPER('$Computer') }) MERGE (user)-[:AdminTo]->(computer)" } )
                            }
                        }
                    }
                }
                Write-Verbose "Done enumerating GPO local group memberships for domain $TargetDomain"
            }
            Write-Verbose "Done enumerating GPO local group"
            # TODO: cypher query to add 'domain admins' to every found machine
        }

        # get the current user so we can ignore it in the results
        $CurrentUser = ([Environment]::UserName).toLower()

        # script block that enumerates a server
        $HostEnumBlock = {
            Param($ComputerName, $CurrentUser2, $UseLocalGroup2, $UseSession2, $UseLoggedon2, $DomainSID2)

            ForEach ($TargetComputer in $ComputerName) {
                $Up = Test-Connection -Count 1 -Quiet -ComputerName $TargetComputer
                if($Up) {
                    if($UseLocalGroup2) {
                        # grab the users for the local admins on this server
                        $Results = Get-NetLocalGroup -ComputerName $TargetComputer -API -IsDomain -DomainSID $DomainSID2
                        if($Results) {
                            $Results
                        }
                        else {
                            Get-NetLocalGroup -ComputerName $TargetComputer -IsDomain -DomainSID $DomainSID2
                        }
                    }

                    $IPAddress = @(Get-IPAddress -ComputerName $TargetComputer)[0].IPAddress

                    if($UseSession2) {
                        ForEach ($Session in $(Get-NetSession -ComputerName $TargetComputer)) {
                            $UserName = $Session.sesi10_username
                            $CName = $Session.sesi10_cname

                            if($CName -and $CName.StartsWith("\\")) {
                                $CName = $CName.TrimStart("\")
                            }

                            # make sure we have a result
                            if (($UserName) -and ($UserName.trim() -ne '') -and ($UserName -notmatch '\$') -and ($UserName -notmatch $CurrentUser2)) {
                                # Try to resolve the DNS hostname of $Cname
                                try {
                                    $CNameDNSName = [System.Net.Dns]::GetHostEntry($CName) | Select-Object -ExpandProperty HostName
                                }
                                catch {
                                    $CNameDNSName = $CName
                                }
                                @{
                                    'UserDomain' = $Null
                                    'UserName' = $UserName
                                    'ComputerName' = $TargetComputer
                                    'IPAddress' = $IPAddress
                                    'SessionFrom' = $CName
                                    'SessionFromName' = $CNameDNSName
                                    'LocalAdmin' = $Null
                                    'Type' = 'UserSession'
                                }
                            }
                        }
                    }

                    if($UseLoggedon2) {
                        ForEach ($User in $(Get-NetLoggedon -ComputerName $TargetComputer)) {
                            $UserName = $User.wkui1_username
                            $UserDomain = $User.wkui1_logon_domain

                            # ignore local account logons
                            if($TargetComputer -notmatch "^$UserDomain") {
                                if (($UserName) -and ($UserName.trim() -ne '') -and ($UserName -notmatch '\$')) {
                                    @{
                                        'UserDomain' = $UserDomain
                                        'UserName' = $UserName
                                        'ComputerName' = $TargetComputer
                                        'IPAddress' = $IPAddress
                                        'SessionFrom' = $Null
                                        'SessionFromName' = $Null
                                        'LocalAdmin' = $Null
                                        'Type' = 'UserSession'
                                    }
                                }
                            }
                        }

                        ForEach ($User in $(Get-LoggedOnLocal -ComputerName $TargetComputer)) {
                            $UserName = $User.UserName
                            $UserDomain = $User.UserDomain

                            # ignore local account logons ?
                            if($TargetComputer -notmatch "^$UserDomain") {
                                @{
                                    'UserDomain' = $UserDomain
                                    'UserName' = $UserName
                                    'ComputerName' = $TargetComputer
                                    'IPAddress' = $IPAddress
                                    'SessionFrom' = $Null
                                    'SessionFromName' = $Null
                                    'LocalAdmin' = $Null
                                    'Type' = 'UserSession'
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    PROCESS {
        if ($TargetDomains -and (-not $SkipComputerEnumeration)) {
            
            if($Statements) {
                $Statements.Clear()
            }
            [Array]$TargetComputers = @()

            ForEach ($TargetDomain in $TargetDomains) {

                $DomainSID = Get-DomainSid -Domain $TargetDomain

                $ScriptParameters = @{
                    'CurrentUser2' = $CurrentUser
                    'UseLocalGroup2' = $UseLocalGroup
                    'UseSession2' = $UseSession
                    'UseLoggedon2' = $UseLoggedon
                    'DomainSID2' = $DomainSID
                }

                if($CollectionMethod -eq 'Stealth') {
                    Write-Verbose "Executing stealth computer enumeration of domain $TargetDomain"

                    Write-Verbose "Querying domain $TargetDomain for File Servers"
                    $TargetComputers += Get-NetFileServer -Domain $TargetDomain -DomainController $DomainController

                    Write-Verbose "Querying domain $TargetDomain for DFS Servers"
                    $TargetComputers += ForEach($DFSServer in $(Get-DFSshare -Domain $TargetDomain -DomainController $DomainController)) {
                        $DFSServer.RemoteServerName
                    }

                    Write-Verbose "Querying domain $TargetDomain for Domain Controllers"
                    $TargetComputers += ForEach($DomainController in $(Get-NetDomainController -LDAP -DomainController $DomainController -Domain $TargetDomain)) {
                        $DomainController.dnshostname
                    }

                    $TargetComputers = $TargetComputers | Where-Object {$_ -and ($_.Trim() -ne '')} | Sort-Object -Unique
                }
                else {
                    if($ComputerName) {
                        Write-Verbose "Using specified -ComputerName target set"
                        if($ComputerName -isnot [System.Array]) {$ComputerName = @($ComputerName)}
                        $TargetComputers = $ComputerName
                    }
                    else {
                        Write-Verbose "Enumerating all machines in domain $TargetDomain"
                        $ComputerSearcher = Get-DomainSearcher -Domain $TargetDomain -DomainController $DomainController -ADSPath $ComputerADSpath
                        $ComputerSearcher.filter = '(sAMAccountType=805306369)'
                        $Null = $ComputerSearcher.PropertiesToLoad.Add('dnshostname')
                        $TargetComputers = $ComputerSearcher.FindAll() | ForEach-Object {$_.Properties.dnshostname}
                        $ComputerSearcher.Dispose()
                    }
                }
                $TargetComputers = $TargetComputers | Where-Object { $_ }

                New-ThreadedFunction -ComputerName $TargetComputers -ScriptBlock $HostEnumBlock -ScriptParameters $ScriptParameters -Threads $Threads | ForEach-Object {
                    if($_['Type'] -eq 'UserSession') {
                        if($_['SessionFromName']) {
                            try {
                                $SessionFromName = $_['SessionFromName']
                                $UserName = $_['UserName'].ToUpper()
                                $ComputerDomain = $_['SessionFromName'].SubString($_['SessionFromName'].IndexOf('.')+1).ToUpper()

                                if($UserDomainMappings) {
                                    $UserDomain = $Null
                                    if($UserDomainMappings[$UserName]) {
                                        if($UserDomainMappings[$UserName].Count -eq 1) {
                                            $UserDomain = $UserDomainMappings[$UserName]
                                            $LoggedOnUser = "$UserName@$UserDomain"
                                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                                $SessionWriter.WriteLine("`"$SessionFromName`",`"$LoggedOnUser`",`"1`"")
                                            }
                                            else {
                                                $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$LoggedOnUser') }) MERGE (computer:Computer { name: UPPER('$SessionFromName') }) MERGE (computer)-[:HasSession {Weight: '1'}]->(user)" } )
                                            }
                                        }
                                        else {
                                            $ComputerDomain = $_['SessionFromName'].SubString($_['SessionFromName'].IndexOf('.')+1).ToUpper()

                                            $UserDomainMappings[$UserName] | ForEach-Object {
                                                # for multiple GC results, set a weight of 1 for the same domain as the target computer
                                                if($_ -eq $ComputerDomain) {
                                                    $UserDomain = $_
                                                    $LoggedOnUser = "$UserName@$UserDomain"
                                                    if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                                        $SessionWriter.WriteLine("`"$SessionFromName`",`"$LoggedOnUser`",`"1`"")
                                                    }
                                                    else {
                                                        $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$LoggedOnUser') }) MERGE (computer:Computer { name: UPPER('$SessionFromName') }) MERGE (computer)-[:HasSession {Weight: '1'}]->(user)" } )
                                                    }
                                                }
                                                # and set a weight of 2 for all other users in additional domains
                                                else {
                                                    $UserDomain = $_
                                                    $LoggedOnUser = "$UserName@$UserDomain"
                                                    if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                                        $SessionWriter.WriteLine("`"$SessionFromName`",`"$LoggedOnUser`",`"2`"")
                                                    }
                                                    else {
                                                        $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$LoggedOnUser') }) MERGE (computer:Computer { name: UPPER('$SessionFromName') }) MERGE (computer)-[:HasSession {Weight: '2'}]->(user)" } )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        # no user object in the GC with this username, so set the domain to "UNKNOWN"
                                        $LoggedOnUser = "$UserName@UNKNOWN"
                                        if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                            $SessionWriter.WriteLine("`"$SessionFromName`",`"$LoggedOnUser`",`"2`"")
                                        }
                                        else {
                                            $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$LoggedOnUser') }) MERGE (computer:Computer { name: UPPER('$SessionFromName') }) MERGE (computer)-[:HasSession {Weight: '2'}]->(user)" } )
                                        }
                                    }
                                }
                                else {
                                    # if not using GC mappings, set the weight to 2
                                    $LoggedOnUser = "$UserName@$ComputerDomain"
                                    if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                        $SessionWriter.WriteLine("`"$SessionFromName`",`"$LoggedOnUser`",`"2`"")
                                    }
                                    else {
                                        $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$LoggedOnUser') }) MERGE (computer:Computer { name: UPPER('$SessionFromName') }) MERGE (computer)-[:HasSession {Weight: '2'}]->(user)"} )
                                    }
                                }
                            }
                            catch {
                                Write-Warning "Error extracting domain from $SessionFromName"
                            }
                        }
                        elseif($_['SessionFrom']) {
                            $SessionFromName = $_['SessionFrom']
                            $LoggedOnUser = "$($_['UserName'])@UNKNOWN"
                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $SessionWriter.WriteLine("`"$SessionFromName`",`"$LoggedOnUser`",`"2`"")
                            }
                            else {
                                $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER(`"$LoggedOnUser`") }) MERGE (computer:Computer { name: UPPER(`"$SessionFromName`") }) MERGE (computer)-[:HasSession {Weight: '2'}]->(user)"} )
                            }
                        }
                        else {
                            # assume Get-NetLoggedOn result
                            $UserDomain = $_['UserDomain']
                            $UserName = $_['UserName']
                            try {
                                if($DomainShortnameMappings[$UserDomain]) {
                                    # in case the short name mapping is 'cached'
                                    $AccountName = "$UserName@$($DomainShortnameMappings[$UserDomain])"
                                }
                                else {
                                    $MemberSimpleName = "$UserDomain\$UserName" | Convert-ADName -InputType 'NT4' -OutputType 'Canonical'

                                    if($MemberSimpleName) {
                                        $MemberDomain = $MemberSimpleName.Split('/')[0]
                                        $AccountName = "$UserName@$MemberDomain"
                                        $DomainShortnameMappings[$UserDomain] = $MemberDomain
                                    }
                                    else {
                                        $AccountName = "$UserName@UNKNOWN"
                                    }
                                }

                                $SessionFromName = $_['ComputerName']

                                if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                    $SessionWriter.WriteLine("`"$SessionFromName`",`"$AccountName`",`"1`"")
                                }
                                else {
                                    $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$AccountName') }) MERGE (computer:Computer { name: UPPER('$SessionFromName') }) MERGE (computer)-[:HasSession {Weight: '1'}]->(user)" } )
                                }
                            }
                            catch {
                                Write-Verbose "Error converting $UserDomain\$UserName : $_"
                            }
                        }
                    }
                    elseif($_['Type'] -eq 'LocalUser') {
                        $Parts = $_['AccountName'].split('\')
                        $UserDomain = $Parts[0]
                        $UserName = $Parts[-1]

                        if($DomainShortnameMappings[$UserDomain]) {
                            # in case the short name mapping is 'cached'
                            $AccountName = "$UserName@$($DomainShortnameMappings[$UserDomain])"
                        }
                        else {
                            $MemberSimpleName = "$UserDomain\$UserName" | Convert-ADName -InputType 'NT4' -OutputType 'Canonical'

                            if($MemberSimpleName) {
                                $MemberDomain = $MemberSimpleName.Split('/')[0]
                                $AccountName = "$UserName@$MemberDomain"
                                $DomainShortnameMappings[$UserDomain] = $MemberDomain
                            }
                            else {
                                $AccountName = "$UserName@UNKNOWN"
                            }
                        }

                        $ComputerName = $_['ComputerName']
                        if($_['IsGroup']) {
                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $LocalAdminWriter.WriteLine("`"$ComputerName`",`"$AccountName`",`"group`"")
                            }
                            else {
                                $Null = $Statements.Add( @{ "statement"="MERGE (group:Group { name: UPPER('$AccountName') }) MERGE (computer:Computer { name: UPPER('$ComputerName') }) MERGE (group)-[:AdminTo]->(computer)" } )
                            }
                        }
                        else {
                            if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
                                $LocalAdminWriter.WriteLine("`"$ComputerName`",`"$AccountName`",`"user`"")
                            }
                            else {
                                $Null = $Statements.Add( @{"statement"="MERGE (user:User { name: UPPER('$AccountName') }) MERGE (computer:Computer { name: UPPER('$ComputerName') }) MERGE (user)-[:AdminTo]->(computer)" } )
                            }
                        }
                    }

                    if (($PSCmdlet.ParameterSetName -eq 'RESTAPI') -and ($Statements.Count -ge $Throttle)) {
                        $Json = @{ "statements"=[System.Collections.Hashtable[]]$Statements }
                        $JsonRequest = ConvertTo-Json20 $Json
                        $Null = $WebClient.UploadString($URI.AbsoluteUri + "db/data/transaction/commit", $JsonRequest)
                        $Statements.Clear()
                        [GC]::Collect()
                    }
                }
            }
        }
    }

    END {

        if ($PSCmdlet.ParameterSetName -eq 'CSVExport') {
            if($SessionWriter) {
                $SessionWriter.Dispose()
                $SessionFileStream.Dispose()
            }
            if($GroupWriter) {
                $GroupWriter.Dispose()
                $GroupFileStream.Dispose()
            }
            if($ACLWriter) {
                $ACLWriter.Dispose()
                $ACLFileStream.Dispose()
            }
            if($LocalAdminWriter) {
                $LocalAdminWriter.Dispose()
                $LocalAdminFileStream.Dispose()
            }
            if($TrustWriter) {
                $TrustWriter.Dispose()
                $TrustsFileStream.Dispose()
            }

            Write-Output "Done writing output to CSVs in: $OutputFolder\$CSVExportPrefix"
        }
        else {
           $Json = @{ "statements"=[System.Collections.Hashtable[]]$Statements }
           $JsonRequest = ConvertTo-Json20 $Json
           $Null = $WebClient.UploadString($URI.AbsoluteUri + "db/data/transaction/commit", $JsonRequest)
           $Statements.Clear()
           Write-Output "Done sending output to neo4j RESTful API interface at: $($URI.AbsoluteUri)"
        }

        [GC]::Collect()
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
    (func netapi32 DsEnumerateDomainTrusts ([Int]) @([String], [UInt32], [IntPtr].MakeByRefType(), [IntPtr].MakeByRefType())),
    (func netapi32 NetApiBufferFree ([Int]) @([IntPtr])),
    (func advapi32 ConvertSidToStringSid ([Int]) @([IntPtr], [String].MakeByRefType()) -SetLastError)
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

Set-Alias Get-BloodHoundData Invoke-BloodHound

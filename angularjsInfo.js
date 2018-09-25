function getModule(moduleName) {
    var mod = {};
    try {
        mod = angular.module(moduleName);
    } catch (e) {
        console.warn('Angular module not found', moduleName);
    }
    return mod;
} 

function getRegistrationsForModule(moduleName) {
    return getModule(moduleName)._invokeQueue || [];
}

function getRegistrationBreakdownForModule(moduleName) {
    var breakdown = {};
    getRegistrationsForModule(moduleName)
        .map(reg => {
            var type = reg[1];
            var name = reg[2][0];
            if (type === 'register') {
                type = (reg[0] || '')
                    .replace('$', '')
                    .replace('Provider', '');
            }
            return {
                type,
                name
            };
        })
        .forEach(reg => {
            if (!breakdown[reg.type]) {
                breakdown[reg.type] = [];
            }
            breakdown[reg.type].push(reg.name);
        });
    return breakdown;
}

function getDepsForModule(moduleName) {
    var deps = [];
    var regBreakdown = getRegistrationBreakdownForModule(moduleName);
    for(var depType in regBreakdown) {
        deps = [...deps, ...regBreakdown[depType]];
    }
    return deps.sort();
}

function getInjectedDepsForModule(moduleName) {
    var depSet = new Set(getRegistrationsForModule(moduleName)
        .map(reg => reg[2])
        .map(reg => reg[1])
        .map(reg => {
            if (Array.isArray(reg)) {
                return reg.slice(0, reg.length - 1);
            }
            if (Array.isArray(reg.controller)) {
                return reg.controller.slice(0, reg.controller.length - 1);
            }
            return null;
        })
        .filter(deps => !!deps)
        .reduce((deps, currDeps) => [...deps, ...currDeps], [])
        .filter(dep => !dep.startsWith('$')));
    return [...depSet].sort();
}

function getInjectedDepsFromOtherModule(moduleName, otherModuleName) {
    var injectedDeps = getInjectedDepsForModule(moduleName);
    var otherModuleDeps = getDepsForModule(otherModuleName);
    return injectedDeps
        .filter(injectedDep => otherModuleDeps.includes(injectedDep));
}
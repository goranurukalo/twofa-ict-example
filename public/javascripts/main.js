var example = (function () {
    //
    // Function to get proper url
    //
    var getApiUrl = function (path) {
        if (typeof path == 'undefined') path = '';
        return 'http://localhost:3000/api/' + path;
    };

    //
    // ajax generic function 
    //
    var _ajax = function (options) {
        var defaultOptions = {
            url: null,
            method: 'GET',
            data: null,
            dataType: 'json',
            beforeSend: null,
            success: null,
            error: null,
            complete: null,
            withCredentials: true,
        };

        Object.keys(defaultOptions).forEach(function (item) {
            if (options[item] !== undefined) {
                defaultOptions[item] = options[item];
            }
        });

        defaultOptions.url = getApiUrl(defaultOptions.url);

        if (typeof defaultOptions.data !== "string") {
            defaultOptions.data = JSON.stringify(defaultOptions.data);
        }

        var ajaxOptions = {
            url: defaultOptions.url,
            type: defaultOptions.method,
            data: defaultOptions.data,
            xhrFields: { withCredentials: defaultOptions.withCredentials },
            dataType: defaultOptions.dataType,
            cache: false,
            beforeSend: function (request) {
                handleCursorLoader(1);
                if (typeof defaultOptions.beforeSend == 'function') {
                    defaultOptions.beforeSend(request);
                }
            },
            success: function (data) {
                if (typeof defaultOptions.success == 'function') {
                    defaultOptions.success(data);
                }
            },
            error: function (xhr, status) {
                if (typeof defaultOptions.error == 'function') {
                    defaultOptions.error(xhr, status);
                }

                if (xhr.status === 401) {
                    console.log("xhr", xhr);
                    //maybe remove all cookies?
                    clearAllCookies();
                }
            },
            complete: function (xhr, status) {
                handleCursorLoader(-1);
                if (typeof defaultOptions.complete == 'function') {
                    defaultOptions.complete(xhr, status);
                }
            }
        };

        ajaxOptions["contentType"] = 'application/json; charset=utf-8';

        $.ajax(ajaxOptions);
    };

    //
    // loader handler
    //
    loaderCount = 0;
    function handleCursorLoader(loader) {
        loaderCount += loader;

        if (loader == 0 || loaderCount < 0) {
            loaderCount = 0;
        }

        if (loaderCount > 0) {
            $('#page-loader').show();
        } else {
            $('#page-loader').hide();
        }
    }

    //
    // enum generator
    //
    function createEnum(list) {
        if (Array.isArray(list)) {
            return list.reduce(function (a, b) {
                a[b] = b;
                return a;
            }, {});
        }
        return {};
    }

    //
    // this is for type of form
    //
    var forms = createEnum(['LOGIN', 'REGISTER', 'TWOFA']);
    //
    // this is for type of message (popup message)
    //
    var msgTypes = createEnum(['success', 'error', 'info']);

    function validateForm(e, formToValidate) {
        e.preventDefault();
        if ($('#membership').data('bs.validator').hasErrors()) return;

        switch (formToValidate) {
            case forms.LOGIN:
                loginForm();
                break;
            case forms.REGISTER:
                registerForm();
                break;
            case forms.TWOFA:
                twofaForm();
                break;
            default:
                console.log("%c There is no such form as: " + formToValidate, "background-color:purple;color:white;");
                break;
        }
    }//done

    function preValidate() {
        var $form = $('#membership')
        $form.validator('validate');
        var data = $form.serializeArray().reduce(function (obj, item) {
            obj[item.name] = item.value;
            return obj;
        }, {});
        return { form: $form, data: data };
    }//done

    function setupLoginForm() {
        clearAllCookies();
        clearAllLocalStorage();
    }//done

    function loginForm() {
        var input = preValidate();

        var _d = input.data;
        var sendData = {
            pin: _d.twofa,
            password: _d.password,
            email: _d.email
        };

        _ajax({
            url: 'login',
            method: "POST",
            data: sendData,
            success: function (res) {
                Cookies.set("token", res.token);
                redirectToPage('/app');
            },
            error: function (res) {
                if (res.responseJSON && res.responseJSON.error === "PIN_MISSING") {
                    errorAlertMessage("Please insert TwoFA Code.");
                } else if (res.responseJSON && res.responseJSON.error === "PIN_NOT_VALID") {
                    errorAlertMessage("TwoFA Code is not valid.");
                } else {
                    errorAlertMessage("Username and password do not match or you do not have an account yet.");
                }
            }
        });
    }//done

    function registerForm() {
        var input = preValidate();
        var _d = input.data;

        var sendData = {
            email: _d.email,
            password: _d.password,
        };

        _ajax({
            url: "register",
            method: "POST",
            data: sendData,
            success: function (res) {
                redirectToForm(forms.LOGIN, "success", "You have successfully created your new account.");
            },
            error: function (res) {
                console.log("error: ", res);
                errorAlertMessage(keyConverter(getErrorMessageFromResponse(res)) || "Some error occured.");
            }
        });
    }//done

    function setupTwofaPage() {
        _ajax({
            url: "admin-user/twofa/google",
            method: "GET",
            success: function (data) {
                //set qrc kod
            },
            error: function (res) {
                console.log("error:", res);
            },
        });
    }//done

    function twofaForm() {
        var input = preValidate();
        var _d = input.data;

        var sendData = {
            pin: _d.pin,
        };

        _ajax({
            url: "set-twofa",
            method: "POST",
            data: sendData,
            success: function (res) {
                $appSelectors.twoFA.addClass('i-hide');
                $appSelectors.app.removeClass('i-hide');
                setupAppView(res.userData);
            },
            error: function (res) {
                console.log("error: ", res);
                errorAlertMessage(keyConverter(getErrorMessageFromResponse(res)) || "Some error occured.");
            }
        });
    }

    var $appSelectors = {
        twoFA: $("#must_twofa"),
        app: $("#our_app")
    };
    function setupApp() {
        _ajax({
            url: "user-data",
            method: "GET",
            success: function (data) {
                var userData = data.userData;

                if (data.isTwofaSet) {
                    $appSelectors.app.removeClass('i-hide');
                    setupAppView(userData);
                } else {
                    $appSelectors.twoFA.removeClass('i-hide');
                    setupTwofaView(data.twofaData.qrImage);
                }
            },
            error: function (res) {
                clearAllCookies();
                return redirectToPage('/');
            },
        });
    }


    function setupAppView(data) { 
        $("#userImage").html(`<img src='${data.avatarUrl}' alt='users avatar image'/>`);
        $("#userEmail").text(data.email);
        $("#userCreatedAt").text((new Date(data.createdAt)).toLocaleString());
        $("#userRole").text(data.role);
    }

    function setupTwofaView(imageLink) {
        $("#2FA_QR_CODE").html(`<img src='${imageLink}' alt='qrcode image' />`);
    }


    //
    // some utilities
    //

    function clearAllCookies() {
        ["token", "bar"].map(function (item) {
            Cookies.remove(item);
        });
    }//done

    var successAlertMessage = function (message) {
        alertMessage(msgTypes.success, message);
    }
    var errorAlertMessage = function (message) {
        alertMessage(msgTypes.error, message);
    }
    var infoAlertMessage = function (message) {
        alertMessage(msgTypes.info, message);
    }
    var alertMessage = function (type, msg) {
        let settings = null;
        if (type == 'success') {
            settings = {
                alertType: 'success',
                icon: 'check',
                title: "Success",
            }
        } else if (type == 'error') {
            settings = {
                alertType: 'danger',
                icon: 'ban',
                title: "Error",
            }
        }
        else if (type == 'info') {
            settings = {
                alertType: 'info',
                icon: 'info',
                title: "Info",
            }
        }

        if (settings !== null) {
            let message = '<div class="alert alert-' + settings.alertType + ' col-lg-6 col-xs-10 alert-dismissible" data-dismiss="alert" aria-hidden="true">' +
                '<h4><i class="icon fa fa-' + settings.icon + '"></i> ' + settings.title + '!</h4>' +
                msg +
                '</div>';
            $('#alert-messages').prepend(message);
        }
    }

    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    function resetURL() {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    function keyConverter(inputString) {
        var result;
        result = inputString.toLowerCase();
        result = result.replace(/_/g, " ");
        if (result.length > 0) {
            result = result.charAt(0).toUpperCase() + result.slice(1);
        }
        return result;
    }

    function redirectToForm(toForm, type, message) {
        var pagePath = "/login";
        switch (toForm) {
            case forms.LOGIN: /*default*/break;
            case forms.REGISTER: pagePath = "/register"; break;
        }

        if (pagePath && type && message) {
            redirectToPage(`${pagePath}?type=${type}&message=${message}`);
        }
    }

    function redirectToPage(path) {
        window.location.replace(path);
    }

    function getErrorMessageFromResponse(r) {
        var result = "Some error occured.";
        if (r && r.responseJSON && r.responseJSON.error) result = r.responseJSON.error || result;
        else result = r.message || result;
        return result;
    }

    //
    // This is logic to present messages to user if we change pages
    //
    (function () {
        var type = getParameterByName("type");
        var msg = getParameterByName("message");

        if (type && msg) {
            alertMessage(type, msg);

            resetURL();
        }
    })();

    function logout() {
        clearAllCookies();
        return redirectToPage('/');
    }

    return {
        validateForm: validateForm,
        forms: forms,
        setupTwofaPage: setupTwofaPage,
        setupLoginForm: setupLoginForm,
        setupApp: setupApp,
        logout: logout,
    }
})();
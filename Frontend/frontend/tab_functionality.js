/* tab functionality
 * This file contains all functions which deal with tab functionality:
 *  - openTab(evt, tabName)      Display only the selected tab in the sidebar
 */

//display the selected tab and hide all others in the sidebar
function openTab(evt, tabName) {                                                //idea from https://www.w3schools.com/howto/howto_js_tabs.asp
    //remove the active class from all objects of the class tabcontent (set them inactiv)
    $(".tabcontent").removeClass("active");
    //remove the active class from all objects of the class tablinks (set them inactiv)
    $(".tablinks").removeClass("active");

    //Show the current selected tab, and add an "active" class to it
    //add the acive class to the selected tab (set it activ)
    document.getElementById(tabName).className += " active";                    //tabName = Heading of the tabs in Mapview_webpage.html lines 50-54
    //add the acive class to the current target (set the content of the selected tab activ)
    evt.currentTarget.className += " active";
}

